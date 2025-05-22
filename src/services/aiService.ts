import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { format, isBefore, isAfter, isSameDay } from 'date-fns';
import { EventType, ApiResponse } from '../types';

const API_KEY = process.env.REACT_APP_DOUBAN_API_KEY || '';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'; // 豆包API地址

// 检查事件冲突
const checkEventConflicts = (newEvent: EventType, existingEvents: EventType[]): string[] => {
  const conflicts: string[] = [];
  
  const newStart = new Date(newEvent.start);
  const newEnd = new Date(newEvent.end);
  
  existingEvents.forEach(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // 如果是同一个事件，跳过
    if (event.id === newEvent.id) return;
    
    // 检查日期冲突 - 只检查时间重叠，不再判断同一天就是冲突
    if (isBefore(newStart, eventEnd) && isAfter(newEnd, eventStart)) {
      conflicts.push(
        `与"${event.title}"(${format(eventStart, 'MM-dd HH:mm')} - ${format(eventEnd, 'HH:mm')})时间冲突`
      );
    }
  });
  
  return conflicts;
};

// 分析用户消息并提取事件信息
export const analyzeMessage = async (
  message: string,
  existingEvents: EventType[],
  selectedDate: Date
): Promise<ApiResponse> => {
  try {
    // 构建请求体
    const requestBody = {
      model: 'doubao-1-5-thinking-pro-m-250428', // 使用豆包模型
      messages: [
        {
          role: 'system',
          content: `你是一个智能的日历助手，可以帮助用户安排日程。当前日期是${format(new Date(), 'yyyy-MM-dd')}。
          
          【重要提示】：
          1. 当用户提供的信息不完整时，请提出问题而不是做出假设。例如：
             - 如果用户没有提供结束时间，请询问事件持续多长时间或何时结束
             - 如果用户的时间描述模糊，请要求澄清
             - 永远不要自动安排超过4小时的事件，除非用户明确指定
             
          2. 对于常见活动类型，使用合理的默认持续时间：
             - 会议：1-2小时
             - 自习/学习：2小时
             - 用餐：1-1.5小时
             - 运动：1-2小时
             
          3. 如果无法确定合理的事件时长，请直接向用户提问，而不是创建事件。
          
          请解析用户输入并提取出事件信息，包括事件标题、开始时间、结束时间、地点和描述。
          如果用户只提供了时间但没有日期，请假设是今天或用户之前选择的日期：${format(selectedDate, 'yyyy-MM-dd')}。
          
          回复格式为JSON，包含以下字段：
          {
            "success": true/false,
            "message": "对用户的回复",
            "events": [
              {
                "title": "事件标题",
                "start": "2023-08-15T14:00:00",
                "end": "2023-08-15T15:00:00",
                "location": "地点（可选）",
                "description": "描述（可选）"
              }
            ]
          }
          
          如果需要向用户提问获取更多信息，请设置success为false，不提供events字段，只在message中提出你的问题。`
        },
        {
          role: 'user',
          content: message
        }
      ]
    };
    
    // 发送请求到豆包API
    const response = await axios.post(API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    // 解析响应
    const aiResponse = response.data.choices[0].message.content;
    let parsedResponse: ApiResponse;
    
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (error) {
      console.error('解析AI响应JSON失败:', error);
      return {
        success: false,
        message: '抱歉，我无法理解您的请求。请尝试更加明确地描述您的日程安排。'
      };
    }
    
    // 处理事件冲突
    if (parsedResponse.events && parsedResponse.events.length > 0) {
      for (const event of parsedResponse.events) {
        // 为每个事件添加ID
        event.id = uuidv4();
        
        // 检查冲突
        const conflicts = checkEventConflicts(event, existingEvents);
        
        if (conflicts.length > 0) {
          parsedResponse.success = false;
          parsedResponse.message = `添加日程"${event.title}"时发现时间冲突: ${conflicts.join(', ')}。请考虑调整时间。`;
          parsedResponse.suggestions = [
            `将"${event.title}"安排在当前时间前`,
            `将"${event.title}"安排在当前冲突事件后`,
            `将冲突的事件调整到其他时间`
          ];
        }
      }
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('AI服务请求失败:', error);
    return {
      success: false,
      message: '抱歉，服务暂时不可用。请稍后再试。'
    };
  }
}; 
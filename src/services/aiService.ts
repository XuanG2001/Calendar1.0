import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { format, isBefore, isAfter, isSameDay, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { EventType, ApiResponse } from '../types';
import { geocode } from './mapService';

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

// 获取指定日期范围内的事件
const getEventsInRange = (events: EventType[], start: Date, end: Date): EventType[] => {
  return events.filter(event => {
    const eventStart = new Date(event.start);
    return isWithinInterval(eventStart, { start, end });
  });
};

// 格式化事件列表为可读文本
const formatEventsToText = (events: EventType[]): string => {
  // 过滤掉无效事件
  const validEvents = events.filter(event => 
    event && event.start && event.end && event.title
  );

  if (validEvents.length === 0) {
    return '暂无日程安排';
  }

  return validEvents
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map(event => {
      const startTime = format(new Date(event.start), 'HH:mm', { locale: zhCN });
      const endTime = format(new Date(event.end), 'HH:mm', { locale: zhCN });
      const location = event.location ? `在${event.location}` : '';
      return `${startTime}-${endTime} ${event.title}${location}`;
    })
    .join('\n');
};

// 分析用户消息并提取事件信息
export const analyzeMessage = async (
  message: string,
  existingEvents: EventType[],
  selectedDate: Date
): Promise<ApiResponse> => {
  try {
    // 构建系统提示
    const systemPrompt = `你是一个智能的日历助手，可以帮助用户安排和查询日程。当前日期是${format(new Date(), 'yyyy-MM-dd')}。

【重要提示】：
1. 你可以处理两种类型的请求：
   A. 日程查询：当用户询问某个时间段的安排时
   B. 日程创建：当用户要创建新的日程时

2. 对于日程查询：
   - 理解用户的时间范围（今天、明天、本周等）
   - 返回该时间范围内的所有日程安排
   - 如果没有安排，明确告知用户

3. 对于日程创建：
   - 当用户提供的信息不完整时，请提出问题而不是做出假设
   - 对于常见活动使用合理的默认持续时间
   - 提取并记录位置信息以便在地图上显示

4. 回复格式：
   A. 对于日程查询：
   {
     "success": true,
     "message": "为您找到以下安排：",
     "type": "query",
     "queryRange": {
       "start": "2024-01-20T00:00:00",
       "end": "2024-01-20T23:59:59"
     }
   }

   B. 对于日程创建：
   {
     "success": true,
     "message": "已添加日程",
     "type": "create",
     "events": [{
       "title": "事件标题",
       "start": "2024-01-20T14:00:00",
       "end": "2024-01-20T15:00:00",
       "location": "地点",
       "description": "描述"
     }]
   }

请分析用户输入，判断是查询还是创建请求，并按照相应格式返回响应。`;

    // 构建请求体
    const requestBody = {
      model: 'doubao-1-5-thinking-pro-m-250428',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ]
    };
    
    // 使用 Netlify Function 代理请求
    const response = await axios.post('/.netlify/functions/chat', requestBody);
    
    // 解析响应
    const aiResponse = response.data.choices[0].message.content;
    let parsedResponse: ApiResponse;
    
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (error) {
      console.error('解析AI响应JSON失败:', error);
      return {
        success: false,
        message: '抱歉，我无法理解您的请求。请尝试更清晰地描述。'
      };
    }
    
    // 处理查询请求
    if (parsedResponse.type === 'query' && parsedResponse.queryRange) {
      const { start, end } = parsedResponse.queryRange;
      const eventsInRange = getEventsInRange(
        existingEvents,
        parseISO(start),
        parseISO(end)
      );
      
      const formattedEvents = formatEventsToText(eventsInRange);
      parsedResponse.message = formattedEvents;
      return parsedResponse;
    }
    
    // 处理创建请求
    if (parsedResponse.type === 'create' && parsedResponse.events) {
      for (const event of parsedResponse.events) {
        event.id = uuidv4();
        
        if (event.location) {
          try {
            console.log('正在获取位置坐标:', event.location);
            const coordinates = await geocode(event.location);
            event.coordinates = {
              longitude: coordinates[0],
              latitude: coordinates[1]
            };
            console.log('成功获取坐标:', event.coordinates);
          } catch (error) {
            console.error('获取位置坐标失败:', error);
          }
        }

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
      message: '抱歉，服务暂时不可用，请稍后再试。'
    };
  }
}; 
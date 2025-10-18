import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface EmployeeInsight {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  productivityTrend: 'increasing' | 'decreasing' | 'stable';
  focusScore: number;
}

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateEmployeeInsights(employeeData: {
    name: string;
    totalActivities: number;
    productiveCount: number;
    unproductiveCount: number;
    neutralCount: number;
    productivityScore: number;
    topDomains: { domain: string; count: number; category: string }[];
    engagementScore: number;
    totalIdleTime: number;
    totalActiveTime: number;
  }): Promise<EmployeeInsight> {
    const prompt = `
You are an AI productivity coach analyzing employee activity data. Provide actionable insights.

Employee: ${employeeData.name}
Total Activities: ${employeeData.totalActivities}
Productivity Score: ${employeeData.productivityScore}%
Engagement Score: ${employeeData.engagementScore}%

Activity Breakdown:
- Productive: ${employeeData.productiveCount} activities
- Unproductive: ${employeeData.unproductiveCount} activities  
- Neutral: ${employeeData.neutralCount} activities

Time Analysis:
- Active Time: ${Math.floor(employeeData.totalActiveTime / 60)} minutes
- Idle Time: ${Math.floor(employeeData.totalIdleTime / 60)} minutes

Top Activities:
${employeeData.topDomains.map(d => `- ${d.domain} (${d.category}): ${d.count} times`).join('\n')}

Provide insights in this JSON format:
{
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "recommendations": ["action 1", "action 2", "action 3"],
  "productivityTrend": "increasing|decreasing|stable",
  "focusScore": 0-100
}

Be specific, actionable, and encouraging. Focus on patterns and practical advice.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/``````/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      
      const insights = JSON.parse(jsonText);
      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      // Return fallback insights
      return {
        summary: `${employeeData.name} has a productivity score of ${employeeData.productivityScore}% based on ${employeeData.totalActivities} activities.`,
        strengths: [
          'Consistent activity tracking',
          'Regular work patterns',
          'Good engagement levels'
        ],
        improvements: [
          'Reduce time on unproductive websites',
          'Increase focus time',
          'Minimize distractions'
        ],
        recommendations: [
          'Set dedicated focus hours',
          'Use website blockers during deep work',
          'Take regular breaks'
        ],
        productivityTrend: 'stable',
        focusScore: employeeData.productivityScore
      };
    }
  }

  async generateDailySummary(activities: any[]): Promise<string> {
    const prompt = `
Analyze this employee's daily activity and create a brief, encouraging summary.

Activities tracked: ${activities.length}
Most visited: ${activities.slice(0, 3).map(a => a.domain).join(', ')}

Create a 2-3 sentence daily summary that:
1. Highlights productive accomplishments
2. Notes any concerns
3. Offers one actionable tip for tomorrow

Keep it brief, positive, and motivating.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Great work today! Keep maintaining your productivity momentum.';
    }
  }

  async suggestFocusActivities(recentActivities: any[]): Promise<string[]> {
    const domains = recentActivities.map(a => a.domain).join(', ');
    
    const prompt = `
Based on these recent activities: ${domains}

Suggest 3 specific, actionable focus activities this person should do in the next hour to boost productivity.

Return as JSON array: ["action 1", "action 2", "action 3"]
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [
        'Complete a high-priority task',
        'Review and respond to important emails',
        'Schedule tomorrow\'s focus blocks'
      ];
    } catch (error) {
      console.error('Error suggesting activities:', error);
      return [
        'Take a 5-minute break',
        'Focus on your top priority task',
        'Close distracting tabs'
      ];
    }
  }
}

export const geminiService = new GeminiService();

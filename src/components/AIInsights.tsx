import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, TrendingDown, Minus, Lightbulb, Target, AlertCircle } from 'lucide-react';
import { geminiService, EmployeeInsight } from '@/lib/geminiService';
import { toast } from 'sonner';

interface AIInsightsProps {
  employeeData: {
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
  };
}

const AIInsights = ({ employeeData }: AIInsightsProps) => {
  const [insights, setInsights] = useState<EmployeeInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    toast.info('🤖 AI is analyzing productivity patterns...');
    
    try {
      const result = await geminiService.generateEmployeeInsights(employeeData);
      setInsights(result);
      toast.success('✨ AI insights generated!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!insights) return null;
    switch (insights.productivityTrend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-orange-600" />;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <CardTitle className="text-2xl">AI-Powered Insights</CardTitle>
          </div>
          <Button 
            onClick={generateInsights} 
            disabled={loading}
            className="gradient-primary text-white"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {insights && (
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              {getTrendIcon()}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Overview</h3>
                <p className="text-muted-foreground">{insights.summary}</p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="outline" className="capitalize">
                    Trend: {insights.productivityTrend}
                  </Badge>
                  <Badge variant="outline">
                    Focus Score: {insights.focusScore}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-lg">Strengths</h3>
            </div>
            <div className="space-y-2">
              {insights.strengths.map((strength, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <p className="text-sm text-green-900">{strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-lg">Areas for Improvement</h3>
            </div>
            <div className="space-y-2">
              {insights.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-600 font-bold mt-0.5">→</span>
                  <p className="text-sm text-orange-900">{improvement}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">AI Recommendations</h3>
            </div>
            <div className="space-y-2">
              {insights.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-blue-600 font-bold mt-0.5">{index + 1}.</span>
                  <p className="text-sm text-blue-900">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}

      {!insights && !loading && (
        <CardContent>
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto text-purple-400 mb-4" />
            <p className="text-muted-foreground mb-4">
              Click "Generate Insights" to get AI-powered productivity analysis
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by Google Gemini AI
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AIInsights;

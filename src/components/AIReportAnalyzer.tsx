
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, FileText, TrendingUp, AlertTriangle, CheckCircle, Copy } from 'lucide-react';

interface AnalysisResult {
  analysis: string;
  analysisType: string;
  reportId: string;
  confidence?: number;
}

interface AIReportAnalyzerProps {
  reportId?: string;
  reportContent?: string;
  className?: string;
}

export const AIReportAnalyzer: React.FC<AIReportAnalyzerProps> = ({ 
  reportId, 
  reportContent: initialContent,
  className = ''
}) => {
  const { toast } = useToast();
  const [reportContent, setReportContent] = useState(initialContent || '');
  const [analysisType, setAnalysisType] = useState<'sentiment' | 'classification' | 'summary' | 'duplicate_detection'>('summary');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);

  const analyzeReport = async () => {
    if (!reportContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter report content to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-report-analysis', {
        body: {
          reportContent,
          reportId: reportId || `temp-${Date.now()}`,
          analysisType
        }
      });

      if (error) throw error;

      const newResult: AnalysisResult = {
        analysis: data.analysis,
        analysisType: data.analysisType,
        reportId: data.reportId,
        confidence: data.confidence
      };

      setResults(prev => [newResult, ...prev]);

      toast({
        title: "Analysis Complete",
        description: `${analysisType} analysis has been generated`
      });

    } catch (error: any) {
      console.error('Error analyzing report:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze report",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runAllAnalyses = async () => {
    const analysisTypes: Array<'sentiment' | 'classification' | 'summary' | 'duplicate_detection'> = 
      ['sentiment', 'classification', 'summary', 'duplicate_detection'];
    
    for (const type of analysisTypes) {
      setAnalysisType(type);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
      await analyzeReport();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Analysis copied to clipboard"
    });
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'sentiment':
        return <TrendingUp className="w-4 h-4" />;
      case 'classification':
        return <AlertTriangle className="w-4 h-4" />;
      case 'summary':
        return <FileText className="w-4 h-4" />;
      case 'duplicate_detection':
        return <Copy className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getAnalysisColor = (type: string) => {
    switch (type) {
      case 'sentiment':
        return 'bg-blue-100 text-blue-800';
      case 'classification':
        return 'bg-orange-100 text-orange-800';
      case 'summary':
        return 'bg-green-100 text-green-800';
      case 'duplicate_detection':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Report Analysis
          </CardTitle>
          <CardDescription>
            Use AI to analyze observation reports for sentiment, classification, summaries, and duplicate detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Report Content
            </label>
            <Textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              placeholder="Enter or paste the observation report content here..."
              rows={6}
              className="resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Analysis Type
            </label>
            <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Summary
                  </div>
                </SelectItem>
                <SelectItem value="sentiment">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Sentiment Analysis
                  </div>
                </SelectItem>
                <SelectItem value="classification">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Classification
                  </div>
                </SelectItem>
                <SelectItem value="duplicate_detection">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Duplicate Detection
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={analyzeReport}
              disabled={isAnalyzing || !reportContent.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </div>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Report
                </>
              )}
            </Button>
            <Button
              onClick={runAllAnalyses}
              disabled={isAnalyzing || !reportContent.trim()}
              variant="outline"
            >
              Run All Analyses
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-generated insights from your observation reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={getAnalysisColor(result.analysisType)}>
                      <div className="flex items-center gap-1">
                        {getAnalysisIcon(result.analysisType)}
                        {result.analysisType.replace('_', ' ').toUpperCase()}
                      </div>
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(result.analysis)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {result.analysis}
                  </div>
                  {result.confidence && (
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

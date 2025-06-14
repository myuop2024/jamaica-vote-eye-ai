
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, FileText, CheckCircle, Phone, MessageSquare, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ObserverDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [reportText, setReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReportSubmit = async () => {
    if (!reportText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a report before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    toast({
      title: "Report Submitted",
      description: "Your observation report has been submitted successfully"
    });
    
    setReportText('');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Observer Portal</h1>
                <p className="text-sm text-gray-600">Field Observation Interface</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Field Observer</p>
              </div>
              <Button 
                variant="outline" 
                onClick={logout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile & Status */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ID Verification</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Complete
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Training Status</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Certified
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{user?.assignedStation}</p>
                    <p className="text-sm text-gray-600">Primary Assignment</p>
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  View Station Details
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Emergency Hotline
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp Support
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Report Submission */}
          <div className="lg:col-span-2">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Submit Observation Report</CardTitle>
                <CardDescription>
                  Document any irregularities, incidents, or general observations from your assigned station
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Report Details</label>
                  <Textarea
                    placeholder="Describe your observations in detail. Include time, location, people involved, and any relevant circumstances..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Drop files here or click to upload
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Images, documents, audio recordings accepted
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleReportSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Report'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReportText('')}
                    disabled={isSubmitting}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Your Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: 1, time: '2:30 PM', status: 'Submitted', preview: 'Normal proceedings observed...' },
                    { id: 2, time: '11:45 AM', status: 'Under Review', preview: 'Reported minor technical issue...' },
                    { id: 3, time: '9:15 AM', status: 'Resolved', preview: 'Station opened on time...' }
                  ].map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{report.preview}</p>
                        <p className="text-xs text-gray-500">Submitted at {report.time}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          report.status === 'Resolved' ? 'border-green-200 text-green-700' :
                          report.status === 'Under Review' ? 'border-yellow-200 text-yellow-700' :
                          'border-blue-200 text-blue-700'
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

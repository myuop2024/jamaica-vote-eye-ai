
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoogleSheetsFormData } from './types';

interface GoogleSheetsFormProps {
  formData: GoogleSheetsFormData;
  onSpreadsheetUrlChange: (value: string) => void;
  onRangeChange: (value: string) => void;
  onDataTypeChange: (value: 'reports' | 'observers' | 'communications') => void;
  isLoading: boolean;
}

export const GoogleSheetsForm: React.FC<GoogleSheetsFormProps> = ({
  formData,
  onSpreadsheetUrlChange,
  onRangeChange,
  onDataTypeChange,
  isLoading
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="spreadsheet">Google Sheets URL or ID</Label>
        <Input
          id="spreadsheet"
          placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit or just the Sheet ID"
          value={formData.spreadsheetId}
          onChange={(e) => onSpreadsheetUrlChange(e.target.value)}
          disabled={isLoading}
        />
        <p className="text-sm text-gray-500">
          You can paste the full Google Sheets URL or just the spreadsheet ID
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="range">Sheet Range</Label>
        <Input
          id="range"
          placeholder="Sheet1!A1:Z1000"
          value={formData.range}
          onChange={(e) => onRangeChange(e.target.value)}
          disabled={isLoading}
        />
        <p className="text-sm text-gray-500">
          Specify the range in A1 notation (e.g., Sheet1!A1:Z1000, Data!A1:C100)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataType">Data Type</Label>
        <Select value={formData.dataType} onValueChange={onDataTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reports">Observation Reports</SelectItem>
            <SelectItem value="observers">Observer Profiles</SelectItem>
            <SelectItem value="communications">Communications</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

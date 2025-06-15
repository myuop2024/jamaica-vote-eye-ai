
export const createToastMessage = {
  settingsLoaded: () => ({
    title: "Settings Loaded",
    description: "Twilio configuration loaded successfully"
  }),
  settingsSaved: () => ({
    title: "Settings Saved",
    description: "Twilio configuration has been updated successfully"
  }),
  testSMSSent: (testNumber: string) => ({
    title: "Test SMS Sent",
    description: `Test message sent successfully to ${testNumber}`
  }),
  validationError: () => ({
    title: "Validation Error",
    description: "Account SID, Auth Token, and From Number are required",
    variant: "destructive" as const
  }),
  fromNumberRequired: () => ({
    title: "Error",
    description: "From Number is required to send test SMS",
    variant: "destructive" as const
  }),
  testConnectionFirst: () => ({
    title: "Info",
    description: "Please save your settings and test the connection first",
    variant: "default" as const
  }),
  loadError: (message?: string) => ({
    title: "Error",
    description: message || "Failed to load Twilio settings",
    variant: "destructive" as const
  }),
  saveError: (message?: string) => ({
    title: "Error",
    description: message || "Failed to save Twilio settings",
    variant: "destructive" as const
  }),
  testSMSError: (message?: string) => ({
    title: "Error",
    description: message || "Failed to send test SMS. Make sure your settings are saved and connection is tested first.",
    variant: "destructive" as const
  })
};

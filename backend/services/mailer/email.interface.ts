export interface EmailContext {
  name: string;
  email: string;
  [key: string]: any;
}

export interface WelcomeEmailContext extends EmailContext {
  loginUrl: string;
  supportEmail: string;
}

export interface PasswordResetEmailContext extends EmailContext {
  resetUrl: string;
  resetToken: string;
  expiresIn: string;
}

export interface ProjectAssignmentEmailContext extends EmailContext {
  projectName: string;
  projectDescription?: string;
  projectEndDate: string;
  dashboardUrl: string;
}

export interface ProjectCompletionEmailContext extends EmailContext {
  projectName: string;
  completedDate: string;
  dashboardUrl: string;
}

export interface EmailTemplate {
  subject: string;
  template: string;
  context: EmailContext;
}

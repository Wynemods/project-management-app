import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

import {
  WelcomeEmailContext,
  PasswordResetEmailContext,
  ProjectAssignmentEmailContext,
  ProjectCompletionEmailContext,
  EmailContext,
} from './email.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendWelcomeEmail(
    email: string,
    context: WelcomeEmailContext,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Welcome to ${this.configService.get('APP_NAME')}!`,
        template: 'welcome',
        context: {
          ...context,
          appName: this.configService.get('APP_NAME'),
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${email}:`,
        error.message,
      );
      throw new InternalServerErrorException('Failed to send welcome email');
    }
  }

  async sendPasswordResetEmail(
    email: string,
    context: PasswordResetEmailContext,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        context: {
          ...context,
          appName: this.configService.get('APP_NAME'),
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(`Password reset email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}:`,
        error.message,
      );
      throw new InternalServerErrorException(
        'Failed to send password reset email',
      );
    }
  }

  async sendProjectAssignmentEmail(
    email: string,
    context: ProjectAssignmentEmailContext,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `New Project Assignment: ${context.projectName}`,
        template: 'project-assignment',
        context: {
          ...context,
          appName: this.configService.get('APP_NAME'),
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(`Project assignment email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send project assignment email to ${email}:`,
        error.message,
      );
      throw new InternalServerErrorException(
        'Failed to send project assignment email',
      );
    }
  }

  async sendProjectCompletionEmail(
    email: string,
    context: ProjectCompletionEmailContext,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Project Completed: ${context.projectName}`,
        template: 'project-completion',
        context: {
          ...context,
          appName: this.configService.get('APP_NAME'),
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(`Project completion email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send project completion email to ${email}:`,
        error.message,
      );
      throw new InternalServerErrorException(
        'Failed to send project completion email',
      );
    }
  }

  async sendProjectOverdueNotification(
    email: string,
    context: ProjectAssignmentEmailContext,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Project Overdue: ${context.projectName}`,
        template: 'project-overdue',
        context: {
          ...context,
          appName: this.configService.get('APP_NAME'),
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(
        `Project overdue notification sent successfully to ${email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send project overdue notification to ${email}:`,
        error.message,
      );
      throw new InternalServerErrorException(
        'Failed to send project overdue notification',
      );
    }
  }

  async sendCustomEmail(
    to: string | string[],
    subject: string,
    template: string,
    context: EmailContext,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: {
          ...context,
          appName: this.configService.get('APP_NAME'),
          currentYear: new Date().getFullYear(),
        },
      });

      this.logger.log(
        `Custom email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send custom email:`, error.message);
      throw new InternalServerErrorException('Failed to send custom email');
    }
  }

  async sendTestEmail(email: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Test Email',
        template: 'test',
        context: {
          name: 'Test User',
          email,
          appName: this.configService.get('APP_NAME'),
          currentYear: new Date().getFullYear().toString(),
          currentDate: new Date().toISOString(),
        },
      });

      this.logger.log(`Test email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send test email to ${email}:`,
        error.message,
      );
      throw new InternalServerErrorException('Failed to send test email');
    }
  }
}

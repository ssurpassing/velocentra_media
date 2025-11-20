import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@bod-avatars.com';

// 发送验证邮件
export async function sendVerificationEmail(
  to: string,
  verificationUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: '验证您的邮箱 - bod_avatars',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>欢迎使用 bod_avatars！</h2>
          <p>请点击下面的链接验证您的邮箱地址：</p>
          <p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
              验证邮箱
            </a>
          </p>
          <p>或复制以下链接到浏览器：</p>
          <p style="color: #666;">${verificationUrl}</p>
          <p style="margin-top: 40px; color: #999; font-size: 14px;">
            如果您没有注册 bod_avatars，请忽略此邮件。
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Send verification email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification email',
    };
  }
}

// 发送密码重置邮件
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: '重置密码 - bod_avatars',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>重置密码</h2>
          <p>您请求重置 bod_avatars 账户的密码。</p>
          <p>请点击下面的链接重置密码：</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
              重置密码
            </a>
          </p>
          <p>或复制以下链接到浏览器：</p>
          <p style="color: #666;">${resetUrl}</p>
          <p style="margin-top: 40px; color: #999; font-size: 14px;">
            如果您没有请求重置密码，请忽略此邮件。此链接将在 24 小时后失效。
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Send password reset email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email',
    };
  }
}

// 发送生成完成通知邮件
export async function sendGenerationCompleteEmail(
  to: string,
  taskId: string,
  resultUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: '您的头像已生成完成 - bod_avatars',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>头像生成完成！</h2>
          <p>您的专业头像已经生成完成。</p>
          <p>
            <a href="${resultUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
              查看结果
            </a>
          </p>
          <p style="margin-top: 40px; color: #999; font-size: 14px;">
            感谢使用 bod_avatars！
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Send generation complete email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send generation complete email',
    };
  }
}



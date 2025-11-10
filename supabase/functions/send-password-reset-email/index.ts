import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  
  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    // Verificar se é realmente um email de reset de senha
    if (email_action_type !== 'recovery') {
      console.log(`Ignoring email action type: ${email_action_type}`)
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    
    // O redirect_to já vem completo do frontend, apenas usar como está
    // Se por algum motivo não vier, usar o padrão de produção
    const redirectUrl = redirect_to || 'https://nomeiai.com.br/auth/reset-password'
    
    console.log('Password reset redirect URL:', redirectUrl)
    
    // Construir URL de reset - o Supabase processa o token e redireciona
    const resetUrl = `${supabaseUrl}/auth/v1/verify?token_hash=${token_hash}&type=recovery&redirect_to=${encodeURIComponent(redirectUrl)}`

    const html = await renderAsync(
      React.createElement(PasswordResetEmail, {
        resetUrl,
        token,
      })
    )

    const { error } = await resend.emails.send({
      from: 'Nomeia Aí <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Redefina sua senha no Nomeia Aí',
      html,
    })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})


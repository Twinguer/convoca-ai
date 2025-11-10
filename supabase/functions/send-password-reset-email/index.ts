import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

// Extrair o secret corretamente
// O Supabase exige o formato v1,whsec_<base64> na variável de ambiente
// Mas a biblioteca standardwebhooks espera apenas whsec_<base64>
// Então removemos o prefixo v1, antes de usar
const rawSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string || ''
let hookSecret = rawSecret

// Remover o prefixo v1, se existir (Supabase exige, mas standardwebhooks não aceita)
if (hookSecret.startsWith('v1,whsec_')) {
  hookSecret = hookSecret.substring(3) // Remove "v1," deixando "whsec_..."
}
// Se não tiver whsec_, adicionar (caso venha apenas base64)
else if (hookSecret && !hookSecret.startsWith('whsec_')) {
  hookSecret = `whsec_${hookSecret}`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    // Verificar se o secret está configurado
    if (!hookSecret) {
      console.error('SEND_EMAIL_HOOK_SECRET não está configurado')
      return new Response(
        JSON.stringify({ error: 'SEND_EMAIL_HOOK_SECRET não configurado' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const wh = new Webhook(hookSecret)
    
    // Verificar se o payload está vazio
    if (!payload) {
      console.error('Payload vazio recebido')
      return new Response(
        JSON.stringify({ error: 'Payload vazio' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Verificando webhook signature...')
    let verifiedData
    try {
      verifiedData = wh.verify(payload, headers) as {
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
    } catch (verifyError) {
      console.error('Erro ao verificar webhook signature:', verifyError)
      return new Response(
        JSON.stringify({ error: 'Falha na verificação do webhook', details: verifyError.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = verifiedData

    // Verificar se é realmente um email de reset de senha
    if (email_action_type !== 'recovery') {
      console.log(`Ignoring email action type: ${email_action_type}`)
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://www.nomeiai.com.br'
    
    console.log('Email action type:', email_action_type)
    console.log('User email:', user.email)
    console.log('Redirect to:', redirect_to)
    
    // Garantir que redirect_to seja uma URL completa válida
    let redirectUrl = redirect_to || `${siteUrl}/auth/reset-password`
    
    // Se redirect_to não começar com http:// ou https://, adicionar o protocolo
    if (redirectUrl && !redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      // Se começar com www., adicionar https://
      if (redirectUrl.startsWith('www.')) {
        redirectUrl = `https://${redirectUrl}`
      } else {
        // Caso contrário, usar siteUrl como base
        redirectUrl = `${siteUrl}${redirectUrl.startsWith('/') ? '' : '/'}${redirectUrl}`
      }
    }
    
    // Garantir que tenha o caminho completo
    if (!redirectUrl.includes('/auth/reset-password')) {
      redirectUrl = `${siteUrl}/auth/reset-password`
    }
    
    console.log('Password reset redirect URL:', redirectUrl)
    
    // Construir URL de reset - o Supabase processa o token e redireciona
    const resetUrl = `${supabaseUrl}/auth/v1/verify?token_hash=${token_hash}&type=recovery&redirect_to=${encodeURIComponent(redirectUrl)}`

    const html = await renderAsync(
      React.createElement(PasswordResetEmail, {
        resetUrl,
        token,
      })
    )

    console.log('Enviando email via Resend...')
    const { error } = await resend.emails.send({
      from: 'Nomeia Aí <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Redefina sua senha no Nomeia Aí',
      html,
    })

    if (error) {
      console.error('Erro ao enviar email via Resend:', error)
      throw error
    }
    
    console.log('Email enviado com sucesso para:', user.email)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending password reset email:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    
    // Retornar erro mais detalhado para debug
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Erro desconhecido',
          name: error.name,
          stack: error.stack,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})


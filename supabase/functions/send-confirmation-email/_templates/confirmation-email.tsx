import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const ConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirme seu cadastro no Convoca Aí</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>Convoca Aí</Heading>
          <Text style={tagline}>Sua classificação em rankings de concursos</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>Bem-vindo ao Convoca Aí! 🎉</Heading>
          
          <Text style={text}>
            Estamos muito felizes por você ter se cadastrado na nossa plataforma!
          </Text>
          
          <Text style={text}>
            Para começar a usar o Convoca Aí e participar de rankings de concursos, 
            você precisa confirmar seu e-mail clicando no botão abaixo:
          </Text>
          
          <Section style={buttonContainer}>
            <Link
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
              target="_blank"
              style={button}
            >
              Confirmar meu e-mail
            </Link>
          </Section>
          
          <Text style={textMuted}>
            Ou copie e cole este código de confirmação:
          </Text>
          <code style={code}>{token}</code>
          
          <Text style={textMuted}>
            Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.
          </Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={footer}>
          <Text style={footerText}>
            <Link
              href="https://www.convocai.com.br"
              target="_blank"
              style={footerLink}
            >
              www.convocai.com.br
            </Link>
          </Text>
          <Text style={footerText}>
            Convoca Aí - Rankings de concursos públicos
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const header = {
  backgroundColor: 'hsl(160, 84%, 39%)',
  padding: '40px 40px 30px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 8px',
  lineHeight: '1.2',
}

const tagline = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '16px',
  margin: '0',
  fontWeight: '400',
}

const content = {
  padding: '40px',
}

const h2 = {
  color: 'hsl(160, 84%, 39%)',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 24px',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const textMuted = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '24px 0 12px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: 'hsl(160, 84%, 39%)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  borderRadius: '6px',
}

const code = {
  display: 'inline-block',
  padding: '16px 24px',
  width: 'calc(100% - 48px)',
  backgroundColor: '#f4f4f4',
  borderRadius: '6px',
  border: '1px solid #e0e0e0',
  color: '#333',
  fontSize: '18px',
  fontFamily: 'monospace',
  textAlign: 'center' as const,
  letterSpacing: '2px',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e0e0e0',
  margin: '0',
}

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '24px 40px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '4px 0',
}

const footerLink = {
  color: 'hsl(160, 84%, 39%)',
  textDecoration: 'none',
  fontWeight: '500',
}

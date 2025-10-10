import React from 'react';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/50 text-muted-foreground border-t mt-12">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo */}
          <div>
            <div>
              <img 
                alt="Nomeia Aí Logo" 
                className="h-30 w-auto object-contain" 
                src="https://tibizurada.store/footer-logo.png"
              />
            </div>
          </div>
          
          {/* Column 2: Contatos */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Contatos</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                <span>contato@nomeiai.com.br</span>
              </li>
              
              <li className="flex items-center mt-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span>São Paulo</span>
              </li>
              <li className="flex items-center mt-2">
                <Instagram className="h-5 w-5 mr-2" />
                <a href="https://instagram.com/nomeia.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  @nomeia.ai
                </a>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Suporte */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li>
                <a href="/faq" className="hover:text-foreground transition-colors">FAQ</a>
              </li>
              <li>
                <a href="mailto:contato@nomeiai.com.br" className="hover:text-foreground transition-colors">Contato</a>
              </li>
              <li>
                <a href="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</a>
              </li>
              <li>
                <a href="/politica-de-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} Nomeia Aí. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
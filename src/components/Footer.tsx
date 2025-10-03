import React from 'react';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-muted/50 text-muted-foreground border-t mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo */}
          <div>
            <div className="mb-4">
              <img 
                alt="Convoca.ai Logo" 
                className="h-30 w-auto object-contain" 
                src="/lovable-uploads/099271d5-4e92-4e8b-825c-a1e72803431f.png" 
              />
            </div>
          </div>
          
          {/* Column 2: Contatos */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Contatos</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                <span>contato@convocai.com.br</span>
              </li>
              <li className="flex items-center mt-2">
                <Phone className="h-5 w-5 mr-2" />
                <span>(11) 95350-1988</span>
              </li>
              <li className="flex items-center mt-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span>São Paulo</span>
              </li>
              <li className="flex items-center mt-2">
                <Instagram className="h-5 w-5 mr-2" />
                <a 
                  href="https://instagram.com/convoca.ai" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-foreground transition-colors"
                >
                  @convoca.ai
                </a>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Suporte */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">FAQ</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Contato</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} Convoca Ai. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

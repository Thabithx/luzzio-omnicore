import { Navbar } from './Navbar';
import { Footer } from './Footer';
import PromoTicker from '../PromoTicker';

export function Layout({ children }) {
   return (
      <div className="min-h-screen flex flex-col">
         <PromoTicker />
         <Navbar />
         <main className="flex-grow pt-[84px] md:pt-20">
            {children}
         </main>
         <Footer />
      </div>
   );
}

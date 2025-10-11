import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        
        {/* Additional sections can be added here */}
        <section id="services" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Premium Services
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Discover our comprehensive suite of luxury digital services designed 
              to elevate your brand and exceed your expectations.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

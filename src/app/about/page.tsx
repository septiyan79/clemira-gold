import Nav from "@/components/landing/Nav";
import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import OurValues from "@/components/about/OurValues";
import HowItWorks from "@/components/about/HowItWorks";
import AboutCTA from "@/components/about/AboutCTA";
import PromoFooter from "@/components/sale/PromoFooter";

export default function AboutPage() {
  return (
    <>
      <Nav />
      <AboutHero />
      <div className="shimmer-line" />
      <OurStory />
      <div className="shimmer-line" />
      <OurValues />
      <HowItWorks />
      <div className="shimmer-line" />
      <AboutCTA />
      <div className="shimmer-line" />
      <PromoFooter />
    </>
  );
}

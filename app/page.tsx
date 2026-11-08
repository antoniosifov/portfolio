import { AboutRow } from "@/components/AboutRow";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Intro } from "@/components/Intro";
import { Process } from "@/components/Process";
import { Reveal } from "@/components/Reveal";
import { Stats } from "@/components/Stats";
import { Work } from "@/components/Work";

export default function Home() {
  return (
    <>
      <Intro />
      <Header />
      <main id="main-content">
        <Hero />
        <Reveal>
          <Stats />
        </Reveal>
        <Reveal>
          <Work />
        </Reveal>
        <Reveal>
          <Experience />
        </Reveal>
        <Reveal>
          <Process />
        </Reveal>
        <Reveal>
          <AboutRow />
        </Reveal>
        <Reveal>
          <Contact />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}

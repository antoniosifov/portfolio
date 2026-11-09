import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Education } from "@/components/Education";
import { Experience } from "@/components/Experience";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Intro } from "@/components/Intro";
import { Reveal } from "@/components/Reveal";
import { Skills } from "@/components/Skills";
import { Work } from "@/components/Work";

export default function Home() {
  return (
    <>
      <Intro />
      <Header />
      <main id="main-content">
        <Hero />
        <Reveal>
          <Work />
        </Reveal>
        <Reveal>
          <Experience />
        </Reveal>
        <Reveal>
          <Education />
        </Reveal>
        <Reveal>
          <Skills />
        </Reveal>
        <Reveal>
          <About />
        </Reveal>
        <Reveal>
          <Contact />
        </Reveal>
      </main>
    </>
  );
}

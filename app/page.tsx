import { About } from "@/components/About";
import { CircuitField } from "@/components/CircuitField";
import { Contact } from "@/components/Contact";
import { Education } from "@/components/Education";
import { Experience } from "@/components/Experience";
import { Finale } from "@/components/Finale";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Intro } from "@/components/Intro";
import { MotionRoot } from "@/components/MotionRoot";
import { Skills } from "@/components/Skills";
import { Through } from "@/components/Through";
import { Work } from "@/components/Work";

export default function Home() {
  return (
    <>
      <Intro />
      <MotionRoot />
      <CircuitField />
      <Header />
      <main id="main-content">
        <Through hero={<Hero />} work={<Work />} />
        <Experience />
        <Education />
        <Skills />
        <Finale about={<About />} contact={<Contact />} />
      </main>
    </>
  );
}

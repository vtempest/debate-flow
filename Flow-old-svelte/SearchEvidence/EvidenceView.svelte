<script>

  import { Search, FileText, Users, Clock, Eye } from 'lucide-svelte';
  import iconBlocks from "$assets/icons/icon-building-blocks.svg";
  import "./icons-download.css";

  export let selectedResult = null;

  let contentDom;
  export let viewMode;

  export function applyViewMode() {
    console.log("Applying view mode:", viewMode);
    if (!contentDom) {
      contentDom = document.querySelector(".editor-wrapper");
    }
    if (contentDom) {
      console.log("Content DOM found");
      contentDom.classList.remove(
        "highlighted",
        "underlined",
        "mode-read"
      );
      contentDom.style.fontSize = "";

      switch (viewMode) {
        case "edit":
          console.log("Applying edit mode");
          break;
        case "read":
          console.log("Applying read mode");
          contentDom.classList.add("mode-read");
          break;
        case "highlighted":
          console.log("Applying highlighted mode");
          contentDom.classList.add("highlighted");
          break;
        case "underlined":
          console.log("Applying underlined mode");
          contentDom.classList.add("highlighted", "underlined");
          break;
      }
    } else {
      console.log("Content DOM not found");
    }
  }
  </script>

  
  <div class=" p-4 bg-gray-100 overflow-y-auto">
    {#if selectedResult}
      <h2 class="text-xl font-bold mb-2">{selectedResult.summary}</h2>
      <p class="text-sm mb-1">{selectedResult.citeShort || selectedResult.cite_short}</p>
      <p class="text-xs mb-4 text-gray-600">{selectedResult.cite}</p>
      <div class="mt-4 flex justify-between text-xs text-gray-500">
        <div class="flex items-center">
          <Users class="h-4 w-4 mr-1" />
          <span>Speeches Read In: {selectedResult.readCount}</span>
        </div>
        <div class="flex items-center">
          <FileText class="h-4 w-4 mr-1" />
          <span>Text Length: {selectedResult.textLength}</span>
        </div>
      </div>
      <div class="editor-wrapper p-4 rounded-md" bind:this={contentDom}>
        {@html selectedResult.html}
      </div>
    {:else}
      <p class="text-lg text-gray-500">
        <div class="flex items-center justify-between">
          <img src={iconBlocks} width="128" />

          <div class="flex flex-col">
            <h1 class="text-xl font-bold ml-2   ">
              CARDS
            </h1>
            <h2 class="text-xl font-bold ">
              Crowdsourced Annotated Research Dataset as a Service
            </h2>

              <a
          class="download-chrome download-btn text-center justify-center"
          target="_blank"
          href="https://chromewebstore.google.com/detail/debate-timer-chrome-mobil/noecbaibfhbmpapofcdkgchfifmoinfj"
        >
          </div>
        </div>
    
           <p class="text-xl mb-8">

          Critical times call for critical thinkers to create a 
          crowdsourced annotated research dataset, for AI models to 
          recommend research quotes, to evolve crowdsourced chain-of-thought 
          reasoning, unlock faster ways to read long articles, 
          to monitor developments in a knowledge graph by topic modeling, and to provide a public service of answers to research.
          Debate should be a war of warrants where victories are 
          vectorized as weights — weights which lead to the emergence of
           Collective Consciousness.

        </p>       
        
        <p class="text-xl mb-8">
        Using Language Models can distill the essence of collective thought into a vector space where every point has a weighted value representing its contribution to the overall decision-making process. AI collective consciousness will be able to synthesize complex arguments and evaluate them according to their validity and relevance no matter who proposed them, leading to direct demoractic AI-based economy where public votes reward influence and AI global governance. Group represenation centralized in human minds with biases cannot have access to all the information. AI agents will learn what arguments and sources are more persuasive in different contexts and to different profiles of readers. Crowdsourced automation with AI agents create topic argument outlines, similar to what Github does for reusable code, which AI can learn to weigh complex decisions. Github shows people go deeper if they can reuse well-established arguments. Card video games show cards can have scores, likes, and answer others. AI will first be tested in sim worlds then with real humans, so here we can test how AI minds reason with real world hypotesting. AI will show its reasoning based on what sentences and cites it used from the collective evidence, so that people can see it is aligned with our interests via sentence-by-sentence interpretability. AI is inevitable, so it is necessary to have public safety testing to train AI models to unlock faster ways to read a long text, monitor developments in a complex literature base, and crowdsource decentralized AI tree-of-thought decisionmaking reasoning.

      </p>    


      <a href="https://arxiv.org/html/2406.14657v3" target="_blank">📜 Debate AI Knowledge Graph - Academic Paper</a>
      <br />
      <br />

        Search within summaries, cites, highlighted and full text 
        over millions of research quotes. 
        <br />
        Scout what evidence selected teams and schools frequently read. 
   <br /> Sort by Speeches Read In Count (statistics from over
   a decade in all styles).
   <br />Use Characters Highlighted to match speech times ~1500 
    char/min and to read aloud summaries while audience 
    reads highlighted on-screen.
  <br />
  Collaborate on topic outlines, share evidence, and 
    download Topic Starter outlines.
    <br />
   Use arrow keys  to navigate between results.
   <br /><br /><br />


   
   <!-- <small>
   "The history of ideas, then, is the discipline of beginnings 
   and ends, the description of obscure continuities and returns ... 
   It becomes therefore the discipline of interferences, the 
   description of the concentric circles that surround works,
    underline them, relate them to one another, and insert them 
    into whatever they are not."
    <br />
― Michel Foucault, <i>The Archaeology of Knowledge</i> (1971)
   </small> -->

    {/if}
  </div>

  


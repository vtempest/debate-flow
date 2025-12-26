<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Highlighter, Underline, Eraser, Pencil, Sun, Moon, Image, XCircle, Bot, ChevronLeft, ChevronRight, Clipboard } from 'lucide-svelte';
  import { ChatGroq } from '@langchain/groq';
  import { HumanMessage } from '@langchain/core/messages';
  import { apiKey, defaultPrompt, enumLLMs } from '$lib/config/custom-site';  
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import {convertMarkdownToHtml} from "./markdown-to-html";
  
  export let selectedResult: any;
  
  const dispatch = createEventDispatcher();
  
  let activeMode: string | null = null;
  let groqResponse = '';
  let status = 'idle';
  let errorMessage = '';
  let summaryPrompt = defaultPrompt;
  let isExpanded = true;
  let showCopiedMessage = false;
  let isEditModeEnabled = false;
  
  let modelChoice: number;
  $: model = enumLLMs[modelChoice];
  
  function toggleMode(mode: string) {
    activeMode = activeMode === mode ? null : mode;
    dispatch('toggleMarkupMode', activeMode);
  }
  
  function onChangeTextSize(size: 'small' | 'medium' | 'large') {
    dispatch('changeTextSize', size);
  }
  
  function onToggleImages(action: 'show' | 'hide') {
    dispatch('toggleImages', action);
  }
  
  async function summarizeArticle() {
    if (!selectedResult) return;
  
    status = 'calling-groq';
    errorMessage = '';
    try {
      modelChoice = Math.floor(Math.random() * enumLLMs.length);
      model = enumLLMs[modelChoice];
  
      const chat = new ChatGroq({
        apiKey,
        model,
      });
  
      let contextLimit = 5000;
      let context = selectedResult.summary.slice(0, contextLimit);
  
      const messages = [new HumanMessage(`${summaryPrompt} ${context}`)];
      const response = await chat.invoke(messages);
      groqResponse = convertMarkdownToHtml(response.content);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      if (error.response && error.response.status === 429) {
        errorMessage = 'Please wait before trying again.';
      } else {
        errorMessage = 'Error: Failed to summarize the article';
      }
      groqResponse = '';
    } finally {
      status = 'idle';
    }
  }


  
  
  function toggleExpand() {
    isExpanded = !isExpanded;
  }
  
  function copyHtmlToClipboard() {
    if (!selectedResult) return;
  
    let HTMLBlob = new Blob([selectedResult.fullText], { type: 'text/html' });
    let textBlob = new Blob([selectedResult.summary], { type: 'text/plain' });
    const clipboardItem = new window.ClipboardItem({
      'text/html': HTMLBlob,
      'text/plain': textBlob,
    });
    navigator.clipboard.write([clipboardItem]).then(() => {
      showCopiedMessage = true;
      setTimeout(() => {
        showCopiedMessage = false;
      }, 2000);
    });
  }
  
  function handleEditMode() {
    isEditModeEnabled = !isEditModeEnabled;
    dispatch('toggleEditMode', isEditModeEnabled);
  }
  </script>
  
  <div class="max-w-[300px] h-full overflow-y-auto transition-all duration-300" class:w-64={isExpanded} class:w-12={!isExpanded}>
    {#if isExpanded}
      <div class="p-4 space-y-4">
        <div class="flex justify-between items-center">
          <button on:click={toggleExpand} class=" hover:text-slate-200 focus:outline-none">
            <ChevronRight size={24} />
          </button>
        </div>
  
        <!-- <div class="space-y-2">
          <span class="text-xs font-medium">Markup Tools</span>
          <div class="flex flex-wrap gap-2">
            <Button 
              on:click={() => toggleMode('highlight')} 
              variant={activeMode === 'highlight' ? 'secondary' : 'ghost'}
              size="sm"
              class="flex items-center"
            >
              <Highlighter size={16} class="mr-1" />
              Highlight
            </Button>
            <Button 
              on:click={() => toggleMode('underline')} 
              variant={activeMode === 'underline' ? 'secondary' : 'ghost'}
              size="sm"
              class="flex items-center"
            >
              <Underline size={16} class="mr-1" />
              Underline
            </Button>
            <Button 
              on:click={() => toggleMode('eraser')} 
              variant={activeMode === 'eraser' ? 'secondary' : 'ghost'}
              size="sm"
              class="flex items-center"
            >
              <Eraser size={16} class="mr-1" />
              Eraser
            </Button>
          </div>
        </div>
   -->
  
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium">Words: {selectedResult?.word_count || 0}</span>
            <div class="relative">
              <Button on:click={copyHtmlToClipboard} size="sm">
                <Clipboard size={16} class="mr-1" />
                Copy
              </Button>
              {#if showCopiedMessage}
                <div class="absolute top-full left-0 mt-1 px-2 py-1 bg-gray-500 text-white text-xs rounded-md">
                  Copied!
                </div>
              {/if}
            </div>
          </div>
        </div>
  
        <div class="space-y-2">
          <Button 
            on:click={handleEditMode}
            variant={isEditModeEnabled ? 'secondary' : 'ghost'}
            size="sm"
            class="w-full"
          >
            <Pencil size={16} class="mr-1" />
            {isEditModeEnabled ? 'Disable Edit Mode' : 'Enable Edit Mode'}
          </Button>
        </div>
  
        <div class="space-y-2">
          <Input
            bind:value={summaryPrompt}
            placeholder="Ask AI any question..."
            class="w-full"
          />
          <Button 
            on:click={summarizeArticle} 
            disabled={status === 'calling-groq'}
            class="w-full"
          >
            <Bot size={16} class="mr-2" />
            {status === 'calling-groq' ? `Answering with ${model.split('-').slice(0,2).join('-')}` : 'AI Generate'}
          </Button>
        </div>
  
        {#if errorMessage}
          <div class="bg-red-500 text-white p-2 rounded-md">
            {errorMessage}
          </div>
        {/if}
  
        {#if groqResponse}
          <div class="text-sm rounded-md p-2 max-h-[300px] overflow-y-auto">
            {@html groqResponse}
          </div>
        {/if}
      </div>
    {:else}
      <div class="p-2">
        <Button on:click={toggleExpand} variant="ghost" size="sm">
          <ChevronLeft size={24} />
        </Button>
      </div>
    {/if}
  </div>
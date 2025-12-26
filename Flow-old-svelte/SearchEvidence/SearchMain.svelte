<script lang="ts">
import { onMount, createEventDispatcher, afterUpdate } from "svelte";
import { Card, CardContent } from "$lib/components/ui/card";
import { Input } from "$lib/components/ui/input";
import { Button } from "$lib/components/ui/button";
import { Search, FileText, Users, Clock, Eye, SortAsc } from "lucide-svelte";
import * as Select from "$lib/components/ui/select";
import EvidenceView from "./EvidenceView.svelte";
import ActionsRightSidebar from "./ActionsRightSidebar.svelte";
import { Splitpanes, Pane } from "svelte-splitpanes";
import { ORIGIN } from "$lib/config/custom-site";

let searchResults = [];
let isLoading = false;
let error = null;
let searchTerm = "";
let selectedResult = null;
let selectedIndex = -1;
let viewMode = "underlined";
let offset = 0;
let limit = 10;
let filter_by = "readCount:>20";
let sort_by = "_text_match:desc";
let hasMore = true;

let childComponent;
let resultsContainer: HTMLDivElement;
let textSize = 'medium';
let showImages = true;
let isEditModeEnabled = false;
const viewModes = [
    { value: "edit", label: "Edit" },
    { value: "read", label: "Read" },
    { value: "highlighted", label: "Embiggen Highlighted" },
    { value: "underlined", label: "Embiggen Underlined" },
  ];

  // Add this definition for sortOptions
  const sortOptions = [
    { value: "_text_match:desc", label: "Relevance" },
    { value: "readCount:desc", label: "Most Read" },
    // { value: "highlightLength:desc", label: "Highlight Length" },
    // { value: "datePublished:desc", label: "Newest First" },
    // { value: "datePublished:asc", label: "Oldest First" }
  ];
const dispatch = createEventDispatcher();

async function performSearch(loadMore = false) {
  if (!searchTerm.trim() && !loadMore) return;

  isLoading = true;
  error = null;

  if (!loadMore) {
    offset = 0;
    searchResults = [];
    selectedIndex = -1;
  }
  try {
    const response = await fetch(
        ORIGIN+`/api/search-ev?q=${encodeURIComponent(searchTerm)}&offset=${offset}&limit=${limit}` +
        `&filter_by=${filter_by || ""}&sort_by=${sort_by || ""}`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    searchResults = loadMore ? [...searchResults, ...data.hits] : data.hits;

    hasMore = data.hits.length === limit;
    offset += data.hits.length;
    console.log("Search results:", searchResults);

    // Select the first result by default if it's a new search
    if (!loadMore && searchResults.length > 0) {
      selectResult(searchResults[0], 0);
    }
  } catch (e) {
    error = e.message;
    console.error("Search error:", error);
  } finally {
    isLoading = false;
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === "Enter") {
    performSearch();
  }
}

function handleScroll(event: Event) {
  const target = event.target as HTMLDivElement;
  if (
    target.scrollHeight - target.scrollTop <= target.clientHeight + 100 &&
    !isLoading &&
    hasMore
  ) {
    loadMore();
  }
}

function loadMore() {
  if (!isLoading && hasMore) {
    performSearch(true);
  }
}

function highlightText(text: string, highlights: string | undefined): string {
  if (!highlights) return text;
  let result = text;
  const regex = /<em>(.*?)<\/em>/g;
  let match;
  while ((match = regex.exec(highlights)) !== null) {
    const highlightedText = match[1];
    result = result.replace(
      new RegExp(highlightedText, "gi"),
      `<mark>${highlightedText}</mark>`
    );
  }
  return result;
}


function selectResult(result: any, index: number) {
  selectedResult = result;
  selectedIndex = index;
  console.log("Selected result:", selectedResult);
  childComponent.applyViewMode();
  
  // Scroll the selected result into view
  const resultElement = document.querySelector(`[data-index="${index}"]`);
  if (resultElement) {
    resultElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
function handleViewModeChange(event: CustomEvent<string>) {
  viewMode = event.value;
  childComponent.applyViewMode();
}

function handleSortChange(event: CustomEvent<string>) {
  sort_by = event.value;
  performSearch();
}

function handleChangeTextSize(event: CustomEvent<'small' | 'medium' | 'large'>) {
  textSize = event.value;
  // Apply text size to the content
  const content = document.querySelector("#readability-content");
  if (content) {
    content.classList.remove('text-sm', 'text-base', 'text-lg');
    content.classList.add(`text-${textSize}`);
  }
}

function handleToggleImages(event: CustomEvent<'show' | 'hide'>) {
  showImages = event.value === 'show';
  // Toggle visibility of images in the content
  const images = document.querySelectorAll("#readability-content img");
  images.forEach(img => {
    (img as HTMLElement).style.display = showImages ? 'inline-block' : 'none';
  });
}

function handleToggleMarkupMode(event: CustomEvent<string | null>) {
  viewMode = event.value || 'read';
  childComponent.applyViewMode();
}

function handleToggleEditMode(event: CustomEvent<boolean>) {
  isEditModeEnabled = event.value;
  const content = document.querySelector("#readability-content");
  if (content) {
    content.setAttribute("contenteditable", isEditModeEnabled.toString());
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    if (selectedIndex > 0) {
      selectResult(searchResults[selectedIndex - 1], selectedIndex - 1);
    
      document.querySelector('.bg-blue-100').scrollIntoView();
    }
    // Do nothing when at index 0 and clicking left arrow
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    if (selectedIndex < searchResults.length - 1) {
      selectResult(searchResults[selectedIndex + 1], selectedIndex + 1);
    
      document.querySelector('.bg-blue-100').scrollIntoView();
    } else if (hasMore) {
      // If at the end of current results and there are more, load them
      loadMore();
    }
  }
}


onMount(() => {
  console.log("Component mounted");
  if (resultsContainer) {
    resultsContainer.addEventListener('scroll', handleScroll);
  }
  window.addEventListener('keydown', handleKeydown);

  return () => {
    if (resultsContainer) {
      resultsContainer.removeEventListener('scroll', handleScroll);
    }
    window.removeEventListener('keydown', handleKeydown);
  };
});

afterUpdate(() => {
  console.log("After update, view mode:", viewMode);
  childComponent.applyViewMode();
});

// Reactive declaration
$: isSelected = (result: any) => result === selectedResult;
</script>

<svelte:head>
  <title>CARDS: Crowdsourced Annotated Research Dataset as a Service</title>
</svelte:head>

<main class="h-screen">
  <Splitpanes>
    <!-- Left column: Search and Results -->
    <Pane size={25} snapSize={5} maxSize={40}>
      <div class="flex flex-col h-full border-r overflow-hidden">
        <div class="p-2  z-10 sticky top-0">
          <div class="flex gap-1 mb-2">
            <Input
              type="text" 
              bind:value={searchTerm}
              placeholder="Search..."
              on:keypress={handleKeyPress}
              class="flex-grow text-sm"
            />
            <Button on:click={() => performSearch()} disabled={isLoading} size="sm">
              <Search class="h-4 w-4" />
            </Button>
          </div>

          <!-- Search Controls -->
          <div class="flex gap-2 mb-2">
            <Select.Root selected={{value:viewMode}} onSelectedChange={handleViewModeChange}>
              <div class="w-full shadow-sm bg-white">
                <Select.Trigger>
                  <Eye class="h-4 w-4 mr-2" />
                  <Select.Value placeholder="View Mode">
                    {viewModes.find((mode) => mode.value === viewMode)?.label || ""}
                  </Select.Value>
                </Select.Trigger>
              </div>

              <Select.Content class="bg-white shadow-md">
                <Select.Group>
                  <Select.Label>View Mode</Select.Label>
                  {#each viewModes as mode}
                    <Select.Item
                      value={mode.value}
                      class="bg-white " >
                      {mode.label}
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>

            <Select.Root selected={{value:sort_by}} onSelectedChange={handleSortChange}>
              <div class="w-full shadow-sm bg-white">
                <Select.Trigger>
                  <SortAsc class="h-4 w-4 mr-2" />
                  <Select.Value placeholder="Sort By">
                    {sortOptions.find((option) => option.value === sort_by)?.label || ""}
                  </Select.Value>
                </Select.Trigger>
              </div>

              <Select.Content class="bg-white shadow-md">
                <Select.Group>
                  <Select.Label>Sort By</Select.Label>
                  {#each sortOptions as option}
                    <Select.Item
                      value={option.value}
                      class="bg-white hover:bg-blue-10  34" >
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
        </div>

        <!-- Results List  -->
        <div class="flex-grow overflow-y-auto" bind:this={resultsContainer}>
          <div class="p-2">
            {#if isLoading && searchResults.length === 0}
              <p class="text-sm">Loading...</p>
            {:else if error}
              <p class="text-sm text-red-500">Error: {error}</p>
            {:else if searchResults.length === 0}
              <p class="text-sm">No results found.</p>
            {:else}
              <div class="space-y-2">
                {#each searchResults as result, index}
                <div
                  class="cursor-pointer hover:bg-blue-200 transition-colors duration-200 rounded-md"
                  class:bg-blue-100={isSelected(result)}
                  on:click={() => selectResult(result, index)}
                  data-index={index}
                >
              
                    <Card>
                      <CardContent class="p-2">
                        <p class="text-xs font-semibold">
                          {@html highlightText(
                            result.summary?.slice(0, 400),
                            result._formatted?.tag
                          )}
                        </p>
                        <p class="text-xs text-gray-500 truncate">
                          {result.cite_short}
                        </p>
                        <div
                          class="flex justify-between items-center mt-1 text-xs text-gray-400"
                        >
                          <div class="flex items-center">
                            <Users class="h-3 w-3 mr-1" />
                            <span>{result.readCount}</span>
                          </div>
                          <div class="flex items-center">
                            <Clock class="h-3 w-3 mr-1" />
                            <span>{result.highlightLength}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          {#if hasMore || isLoading}
            <div class="p-2 text-center">
              {#if isLoading}
                <p class="text-sm">Loading more results...</p>
              {:else}
                <Button on:click={loadMore} class="w-full">
                  Load More
                </Button>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </Pane>

    <!-- Middle column: Evidence View -->
    <Pane snapSize={5} size={55} minSize={30}>
      <div class="h-full overflow-y-auto">
        <EvidenceView 
          {selectedResult} 
          {viewMode} 
          bind:this={childComponent}
          class={`text-${textSize}`}
        />
      </div>
    </Pane>

    <!-- Right column: Actions Right Sidebar -->
    <Pane size={20} snapSize={5} maxSize={40}>
      <div class="h-full overflow-y-auto">
        <ActionsRightSidebar 
          {selectedResult}
          on:changeTextSize={handleChangeTextSize}
          on:toggleImages={handleToggleImages}
          on:toggleMarkupMode={handleToggleMarkupMode}
          on:toggleEditMode={handleToggleEditMode}
        />
      </div>
    </Pane>
  </Splitpanes>
</main>

<style>
  :global(.splitpanes) {
    height: 100vh;
  }
  :global(.splitpanes__pane) {
    overflow: hidden;
  }
</style>
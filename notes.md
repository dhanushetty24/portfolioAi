## 🚀 The RAG Implementation Flow

Here's the exact playbook we followed to give the AI a brain (our RAG pipeline):

### Part 1: Brain Food (Ingestion)

1. **Load:** We read our raw knowledge base documents (e.g., Markdown files).
2. **Chunk:** We use a text splitter (`RecursiveCharacterTextSplitter`) to chop large documents into bite-sized pieces so the AI doesn't get overwhelmed.
3. **Embed:** We pass these text chunks into an embedding model to translate them into number arrays (vectors) that capture their semantic meaning.
4. **Store:** We save these vectors—along with the original text and metadata (like source filenames)—into our vector database (**ChromaDB**).

### Part 2: Q&A Magic (Retrieval & Generation)

1. **Ask:** The user asks a question (e.g., _"What is his work experience?"_).
2. **Embed Query:** We translate the user's question into a vector using the _same_ embedding model.
3. **Search:** We query ChromaDB for the top `K` document chunks that are mathematically most similar to the question's vector.
4. **Contextualize:** We bundle the retrieved chunks into a neat string (adding helpful source labels like `--- Chunk 1 ---`) and inject it directly into the LLM's System Prompt.
5. **Answer:** The LLM (Gemini) reads the prompt, references our injected context, and formulates a precise, context-aware reply!

# Debugging Notes: RAG Vector Database

Here is a summary of the issues we encountered and fixed, organized by the RAG pipeline flow.

## Part 1: Ingestion Pipeline Issues

### 1. ReferenceError: config is not defined

**Problem:**
When running `npm run injest`, the script crashed with `ReferenceError: config is not defined`.

**Cause:**
We attempted to use `config.knowledgeBase` in `injest.js` without actually importing the `config` module first.

**Fix:**
Added the missing import statement at the top of `injest.js`:

```javascript
import config from '../config.js';
```

### 2. Knowledgebase Directory Does Not Exist

**Problem:**
Running `npm run injest` logged `Knowledgebase directory does not exist.` even though the directory is present in the project root.

**Cause:**
In `config.js`, we map `knowledgeBase: process.env.KNOWLEDGEBASE`. If `KNOWLEDGEBASE` is undefined or misspelled in the `.env` file, `config.knowledgeBase` evaluates to `undefined`. This causes `path.join` to resolve to an incorrect path, making the script look for a folder named `undefined` which doesn't exist.

**Fix:**
Ensure that `KNOWLEDGEBASE` is correctly defined in the `.env` file with the exact name of the folder (e.g., `KNOWLEDGEBASE="knowledgeBase"`).

### 3. Text Splitter Returning Empty Array

**Problem:**
When running the `injest.js` script, the text splitter was returning a blank array instead of chunked text.

**Cause:**
We were passing raw JavaScript objects (`{ filename, text }`) into `splitter.splitDocuments()`. LangChain's `splitDocuments` method expects LangChain `Document` objects containing a `pageContent` property. Because our custom objects were missing this property, LangChain couldn't find any text to extract and returned an empty array.

**Fix:**
Updated `chunkContent.js` to extract the texts and metadatas into separate arrays, and passed them into `splitter.createDocuments(texts, metadatas)`. This method handles the creation of `Document` objects internally and chunks them correctly.

### 4. Text Splitter Error: Cannot read properties of undefined (reading 'loc')

**Problem:**
When running `npm run injest`, the script threw an error: `Cannot read properties of undefined (reading 'loc')`.

**Cause:**
We mapped our files to objects containing `pageContent` and `metaData`. LangChain's `Document` interface specifically expects the property to be named `metadata` (lowercase 'd'). Because `metadata` was undefined, LangChain failed when trying to read or assign properties like `metadata.loc`.

**Fix:**
Changed the property name from `metaData` to `metadata` in the object mapping inside `injest.js`.

### 5. Null Documents and Metadata in Query Results

**Problem:**
When querying the vector database, the results contained correct distances and IDs, but the `documents` and `metadatas` arrays were full of `null` values.

**Cause:**
In `injest.js`, the variables containing the document contents and metadata were named `text` and `metaDatas`. However, the `addDocuments` function in `vectorDb.js` expected an object with the keys `documents` and `metadatas` (lowercase 's'). Because the keys didn't match, ChromaDB saved the embeddings and IDs, but the text and metadata were silently stored as `undefined`.

**Fix:**
Updated the `addDocuments` call in `injest.js` to explicitly map the variables to the correct property names expected by ChromaDB:

```javascript
await addDocuments({
  ids,
  documents: text,
  metadatas: metaDatas,
  embeddings,
});
```

---

## Part 2: Retrieval & Generation Issues

### 6. ReferenceError: embedChunk is not defined

**Problem:**
Running `npm run rag` crashed with a `ReferenceError: embedChunk is not defined`.

**Cause:**
We attempted to use `embedChunk(prompt)` inside `dhanushAI.js` without importing the function from our `embeder.js` file.

**Fix:**
Added the missing import statement at the top of `dhanushAI.js`:

```javascript
import embedChunk from './embeder.js';
```

### 7. ReferenceError: queryDocuments is not defined

**Problem:**
Right after fixing the embedding error, `npm run rag` crashed again with `ReferenceError: queryDocuments is not defined`.

**Cause:**
Similar to the previous error, we were calling `queryDocuments(embeddedPrompt, config.retrivalK)` to retrieve documents from ChromaDB, but we forgot to import it.

**Fix:**
Added the missing import statement at the top of `dhanushAI.js`:

```javascript
import { queryDocuments } from './vectorDb.js';
```

### 8. Incorrect Number of Retrieved Documents

**Problem:**
The pipeline was returning 4 documents on query, even though the `.env` retrieval limit was set to 1.

**Cause:**
There was a spelling mismatch for the environment variable. In `.env`, it was spelled `RETRIVAL_K` (without the middle 'E'), but `config.js` was trying to read `process.env.RETRIEVAL_K`. Since it evaluated to `undefined`, ChromaDB ignored the limit and returned its default number of results.

Additionally, `.env` values are always loaded as strings, but ChromaDB's `nResults` expects an integer.

**Fix:**
Updated `config.js` to use the exact spelling from `.env` and wrapped it in `parseInt()` to ensure ChromaDB receives a number. We also did the same for the chunking configurations to prevent future issues.

```javascript
  chunkSize: parseInt(process.env.CHUNK_SIZE, 10),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10),
  retrivalK: parseInt(process.env.RETRIVAL_K, 10),
```

### 9. Injecting RAG Context into the LLM Prompt

**Enhancement:**
After retrieving the relevant document chunks, we needed a way to feed them into the Gemini model.

**Implementation:**
We updated `dhanushAI.js` to map over `retrievedDocs.documents` and join them into a single string, appending a helpful `--- Chunk X ---` header for each. We then successfully injected this combined content into the `system` role message, instructing the AI to use it to answer the user's prompt clearly and concisely!

### 10. LLM Repetition Collapse (Degeneration Loop)

**Problem:**
When running `npm run rag`, the generated output would occasionally cut off mid-word and infinitely repeat the same paragraph (e.g., `... past projects or tec*   **Cambia Health ...`).

**Cause:**
This is a classic LLM generation loop (often called "repetition collapse"), commonly seen with smaller or "lite" models (like `gemini-3.1-flash-lite`). It was triggered by three compounding factors:
1. **Low Temperature (Greedy Decoding):** Defaulting to deterministic selection caused the model to get stuck in a repetitive token sequence.
2. **Abrupt Prompt Formatting:** The RAG context injected into the prompt was not bounded by clear tags, causing the model to attempt to "continue" the text rather than answer the query.
3. **Duplicate RAG Context:** The LLM reranker occasionally returned the same chunk ID multiple times, causing duplicate text inside the injected context array and heavily biasing the final model to repeat itself.

**Fix:**
We applied fixes across three different files to correct this behavior:
1. **Deduplicating Chunks (`rerankChunk.js`):** Used a Javascript `Set` (`[...new Set(rankedIds)]`) to filter out any duplicate chunk IDs returned by the reranking model.
2. **Prompt Boundary Tags (`dhanushAI.js`):** Wrapped the injected retrieved context within explicit `<context>...</context>` XML tags and added a clear directive (`Do NOT repeat yourself.`).
3. **Increasing Model Temperature (`dhanushAI.js` & `geminiCall.js`):** Updated the `geminiCall` function signature to accept additional configuration options (`...options`), and passed `{ temperature: 0.7 }` to encourage a more diverse and less greedy generation strategy.

<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<temp code changes >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

Ran command: `node proRAG/injest.js `
Viewed chunkContent.js:1-12
Viewed chunkContent.js:1-40
Viewed injest.js:1-78

Here is the detailed analysis of [RAG/chunkContent.js](file:///d:/Projects/Chatbot/RAG/chunkContent.js) vs [proRAG/chunkContent.js](file:///d:/Projects/Chatbot/proRAG/chunkContent.js), along with what's missing and how to process the response further.

---

### 1. Analysis: What is happening in both files?

#### **In [RAG/chunkContent.js](file:///d:/Projects/Chatbot/RAG/chunkContent.js):**
* **Approach**: **Rule-based deterministic splitting** using LangChain's `MarkdownTextSplitter`.
* **How it works**: It takes the input documents and mechanically cuts them into smaller segments strictly based on character counts (`chunkSize`) and character overlap (`overlap`), honoring markdown structure (like headers/lists) where possible.
* **Pros/Cons**: Fast and lightweight, but lacks contextual understanding. It might split a sentence or logical section awkwardly.

#### **In [proRAG/chunkContent.js](file:///d:/Projects/Chatbot/proRAG/chunkContent.js):**
* **Approach**: **Agentic / LLM-based intelligent chunking**.
* **How it works**:
  1. Calculates an estimated chunk count (`howMany = Math.round(docs[0]['pageContent'].length / 200)`).
  2. Constructs a detailed prompt instructing Gemini to analyze the document, understand logical sections (e.g., jobs, projects), add overlap (~25%), generate metadata (`headline`, `summary`), and structure the chunks into a specific JSON schema format.
  3. Sends this prompt to Gemini via `geminiCall(messages)` and logs the raw output.
* **Pros/Cons**: Context-aware chunks with high semantic value, headlines, and summaries. However, LLM text output requires parsing, validation, and returning.

---

### 2. What are you missing or what needs to be done?

1. **Returning the Chunks from `agenticChunk`**:
   * Currently, [proRAG/chunkContent.js](file:///d:/Projects/Chatbot/proRAG/chunkContent.js) prints `response` with `console.log(response)` but **returns `undefined`**.
   * When [proRAG/injest.js](file:///d:/Projects/Chatbot/proRAG/injest.js) executes `const chunkedDocs = await agenticChunk(docs)`, `chunkedDocs` will be `undefined`.

2. **JSON Parsing & Cleaning (Handling Markdown Code Blocks)**:
   * Gemini usually returns its response wrapped inside markdown code fences, such as ` ```json ... ``` ` or raw string text.
   * If you try to pass `response` directly, `JSON.parse` will throw an error if the fence backticks (` ```json `) are present. You need to strip markdown fences before parsing into a JavaScript array/object.

3. **Multi-Document Handling**:
   * Currently, [proRAG/chunkContent.js](file:///d:/Projects/Chatbot/proRAG/chunkContent.js) only looks at `docs[0]`. If you have multiple `.md` files in your knowledge base, it will ignore all documents after the first one unless you loop over `docs` or chunk them individually.

4. **Response Structure Alignment with Prompt**:
   * Your prompt asks Gemini for `{ headline, summary, pageContent, metadata }`, but your requested JSON schema in the prompt specifically asks for `[{ metadata: { source }, pageContent }]`. Aligning the requested prompt JSON schema ensures Gemini puts `headline` and `summary` into the `metadata` object properly.

---

### 3. How to process the response further in `proRAG` (Step-by-Step Explanation)

If you want to continue processing the output from `proRAG` (from raw Gemini response to stored vectors in ChromaDB), follow these steps:

#### **Step 1: Clean and Parse the LLM Response in `chunkContent.js`**
1. Take the string returned by `geminiCall(messages)`.
2. Clean out any leading/trailing markdown blocks (e.g., replacing ` ```json ` and ` ``` ` with empty strings).
3. Call `JSON.parse(cleanedText)` to convert the string into a valid JavaScript Array of chunk objects.
4. `return` the parsed array from `agenticChunk(docs)`.

#### **Step 2: Un-comment and Adapt Ingestion Pipeline in `injest.js`**
1. Un-comment the pipeline logic in [proRAG/injest.js](file:///d:/Projects/Chatbot/proRAG/injest.js) (lines 54–70).
2. Receive the parsed `chunkedDocs` from `await agenticChunk(docs)`.

#### **Step 3: Extract & Format Text, Metadata, and IDs**
1. Loop through `chunkedDocs`.
2. Extract `pageContent` (or combine `headline + summary + pageContent` if you want richer context for retrieval).
3. Construct unique IDs for ChromaDB (e.g., `${chunk.metadata.source}_chunk_${index}`).
4. Extract metadata (preserving `source`, `headline`, and `summary` returned by Gemini).

#### **Step 4: Generate Embeddings & Push to VectorDB**
1. Call `await getEmbeddings(texts)` to compute vector representations for each chunk.
2. Call `await addDocuments(...)` passing the `ids`, `embeddings`, `documents`, and `metadata` to store them inside ChromaDB.
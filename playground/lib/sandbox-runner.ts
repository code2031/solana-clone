/**
 * Sandbox Runner for SolClone Playground
 *
 * NOTE: This module intentionally uses `new Function()` to execute user-provided
 * code in the playground. This is the core purpose of the playground -- to let
 * developers test and experiment with SolClone RPC calls interactively. The
 * execution is client-side only and does not run on the server.
 */

export interface ExecutionResult {
  output: string[];
  error: string | null;
  duration: number;
}

export interface SolCloneHelper {
  rpcUrl: string;
  call: (method: string, params?: unknown[]) => Promise<unknown>;
  getBalance: (address: string) => Promise<unknown>;
  getBlockHeight: () => Promise<unknown>;
  getBlock: (slot: number) => Promise<unknown>;
  getTransaction: (signature: string) => Promise<unknown>;
  getTokenAccountsByOwner: (owner: string, mint: string) => Promise<unknown>;
  sendTransaction: (from: string, to: string, lamports: number) => Promise<unknown>;
  requestAirdrop: (address: string, lamports: number) => Promise<unknown>;
}

function createSolCloneHelper(rpcUrl: string): SolCloneHelper {
  const call = async (method: string, params: unknown[] = []): Promise<unknown> => {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message} (code: ${data.error.code})`);
    }
    return data.result;
  };

  return {
    rpcUrl,
    call,
    getBalance: (address: string) => call("getBalance", [address]),
    getBlockHeight: () => call("getBlockHeight"),
    getBlock: (slot: number) => call("getBlock", [slot, { encoding: "json", transactionDetails: "full" }]),
    getTransaction: (signature: string) => call("getTransaction", [signature, { encoding: "json" }]),
    getTokenAccountsByOwner: (owner: string, mint: string) =>
      call("getTokenAccountsByOwner", [owner, { mint }, { encoding: "jsonParsed" }]),
    sendTransaction: (from: string, to: string, lamports: number) =>
      call("sendTransaction", [{ from, to, lamports }]),
    requestAirdrop: (address: string, lamports: number) =>
      call("requestAirdrop", [address, lamports]),
  };
}

export async function runCode(code: string, rpcUrl: string): Promise<ExecutionResult> {
  const output: string[] = [];
  const start = performance.now();

  const mockConsole = {
    log: (...args: unknown[]) => {
      output.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "));
    },
    error: (...args: unknown[]) => {
      output.push(`[ERROR] ${args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")}`);
    },
    warn: (...args: unknown[]) => {
      output.push(`[WARN] ${args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")}`);
    },
    info: (...args: unknown[]) => {
      output.push(`[INFO] ${args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")}`);
    },
  };

  const solclone = createSolCloneHelper(rpcUrl);

  try {
    // Intentional use of Function constructor: this is a code playground
    // that must evaluate user-written code. Runs client-side only.
    const wrappedCode = `
      return (async () => {
        ${code}
      })();
    `;
    const fn = new Function("console", "solclone", wrappedCode); // eslint-disable-line no-new-func
    await fn(mockConsole, solclone);

    const duration = performance.now() - start;
    return { output, error: null, duration };
  } catch (err: unknown) {
    const duration = performance.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    return { output, error: message, duration };
  }
}

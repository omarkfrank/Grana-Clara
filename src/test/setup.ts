import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Remove os componentes renderizados depois de cada teste.
 *
 * A limpeza explícita garante isolamento mesmo sem utilizar
 * as funções globais do Vitest.
 */
afterEach(() => {
  cleanup();
});

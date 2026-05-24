import { XRProvider } from "@vincentt-sdks/xr-sdk";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";

import { Runtime } from "@core/Runtime";
import type { AppConfig } from "@core/SceneProps";

import { assets } from "@app/config/assets";
import { xrModels } from "@app/config/xrModels";
import { initialScene, scenes } from "@app/scenes";

// The composition root: wires the app's static data into the generic runtime.
// This is the one file allowed to import both @core and @app.
const config: AppConfig = { scenes, initialScene, assets, xrModels };

// In the in-editor preview the app runs in a srcdoc iframe (location
// `about:srcdoc`), so BrowserRouter matches no route. MemoryRouter keeps
// routing in memory. The preview build injects VITE_PREVIEW=true.
const isPreview = import.meta.env.VITE_PREVIEW === "true";
const Router = isPreview ? MemoryRouter : BrowserRouter;

const App = () => (
  <XRProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Runtime config={config} />} />
        <Route path="*" element={<Runtime config={config} />} />
      </Routes>
    </Router>
  </XRProvider>
);

export default App;

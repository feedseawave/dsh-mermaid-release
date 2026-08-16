window.__ModuleLoader__.load({
	id: "@dsh-mermaid-renderer/dsh-client-ui-mermaid",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:E:\projects\harness\mermaid-release\packages\client\ui-mermaid\src\client\MermaidBlock.module.css.mjs
		const css = "._1GguWG_figure svg{max-width:100%;height:auto}";
		const tagId = "@dsh-mermaid-renderer/dsh-client-ui-mermaid/MermaidBlock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-mermaid-renderer/dsh-client-ui-mermaid";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var MermaidBlock_module_css_default = { "figure": "_1GguWG_figure" };
		//#endregion
		//#region src/client/MermaidBlock.tsx
		/**
		* MermaidBlock: renders one settled mermaid fence as an SVG figure inside
		* the shared CodeBlock chrome (language banner + copy stay, so the authored
		* source remains accessible). The mermaid bundle is a package-owned vendor
		* script (`lib/mermaid.js`, the upstream UMD build) served beside this
		* plugin's client bundle at `/plugins/<id>/mermaid.js`; the block injects one
		* shared <script> element on first use, so the multi-megabyte library stays
		* out of every boot path until the first diagram appears. The strict
		* security level keeps model-authored diagrams inert: links are sanitized,
		* scripts and click payloads are dropped. Parse failures and the in-flight
		* load keep the plain CodeBlock surface.
		*/
		/** The vendor script endpoint beside this plugin's client bundle. */
		const VENDOR_SCRIPT = "/plugins/@dsh-mermaid-renderer/dsh-client-ui-mermaid/mermaid.js";
		/** One shared script-loading promise: the script tag is injected once per page. */
		let mermaidReady;
		/**
		* Load the mermaid vendor script through one shared <script> element, or
		* return the already-present global (a test environment may preinstall it).
		*/
		function loadMermaidScript() {
			if (window.mermaid !== void 0) return Promise.resolve(window.mermaid);
			mermaidReady ??= new Promise((resolve, reject) => {
				const script = document.createElement("script");
				script.src = VENDOR_SCRIPT;
				script.onload = () => {
					if (window.mermaid === void 0) reject(/* @__PURE__ */ new Error("mermaid vendor script loaded without exposing window.mermaid"));
					else resolve(window.mermaid);
				};
				script.onerror = () => {
					reject(/* @__PURE__ */ new Error(`failed to load mermaid vendor script ${VENDOR_SCRIPT}`));
				};
				document.head.appendChild(script);
			});
			return mermaidReady;
		}
		let renderSeq = 0;
		/**
		* The fenceview renderer for the 'mermaid' language key.
		* @param props - The fenceview owner share: normalized language and source.
		*/
		function MermaidBlock({ lang, code }) {
			const trimmed = code.endsWith("\n") ? code.slice(0, -1) : code;
			const [figure, setFigure] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				let alive = true;
				setFigure(void 0);
				loadMermaidScript().then((mermaid) => {
					mermaid.initialize({
						startOnLoad: false,
						securityLevel: "strict",
						suppressErrorRendering: true
					});
					return mermaid.render(`dsh-mermaid-${renderSeq++}`, trimmed);
				}).then(({ svg }) => {
					if (alive) setFigure(svg);
				}).catch(() => {});
				return () => {
					alive = false;
				};
			}, [trimmed]);
			if (figure === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.CodeBlock, {
				code,
				lang
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.CodeBlock, {
				code,
				lang,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MermaidBlock_module_css_default.figure,
					dangerouslySetInnerHTML: { __html: figure }
				})
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services: the slot registry only — no locale seat, no store, no wire. */
		const inject = ["slots"];
		/**
		* Client plugin body: owns how 'mermaid' fences render inside assistant
		* markdown.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.slots.inject("conversation.chat.fenceview", () => ctx.slots.register({
				name: "conversation.chat.fenceview",
				key: "mermaid"
			}, MermaidBlock));
		}
		//#endregion
		exports.MermaidBlock = MermaidBlock;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
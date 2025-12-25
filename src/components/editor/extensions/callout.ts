import { Node, mergeAttributes } from "@tiptap/core";

export type CalloutType = "info" | "warning" | "danger" | "success";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type: CalloutType) => ReturnType;
      toggleCallout: (type: CalloutType) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-type") || "info",
        renderHTML: (attributes) => ({
          "data-type": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout="true"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type as CalloutType;
    const colors: Record<CalloutType, string> = {
      info: "bg-blue-50 border-blue-500 dark:bg-blue-950",
      warning: "bg-yellow-50 border-yellow-500 dark:bg-yellow-950",
      danger: "bg-red-50 border-red-500 dark:bg-red-950",
      success: "bg-green-50 border-green-500 dark:bg-green-950",
    };

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "true",
        class: `callout callout-${type} border-l-4 p-4 my-4 rounded-r ${colors[type]}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (type: CalloutType) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type });
        },
      toggleCallout:
        (type: CalloutType) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { type });
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});

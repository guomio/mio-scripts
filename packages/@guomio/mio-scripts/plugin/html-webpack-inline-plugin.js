const HtmlWebpackPlugin = require('html-webpack-plugin');
const PluginName = 'html-webpack-inline-plugin';

/**
 * @class
 */
class HtmlWebpackInlinePlugin {
  /**
   * @param {{ tagName: 'link' | 'script'; voidTag: boolean; innerHTML: string; attributes: Record<string, any>; position: 'headTop' | 'headBottom' | 'bodyTop' | 'bodyBottom' }[]} options
   */
  constructor(options) {
    /**
     * @type {{ tagName: 'link' | 'script'; voidTag: boolean; innerHTML: string; attributes: Record<string, any>; position: 'headTop' | 'headBottom' | 'bodyTop' | 'bodyBottom' }[]}
     */
    this.options = options || [];
    this.pluginName = PluginName;
  }
  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(PluginName, (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
        PluginName,
        (data, cb) => {
          cb(null, this.processTags(data));
        },
      );
    });
  }

  processTags(data) {
    const bodyTopTags = [];
    const bodyBottomTags = [];
    const headTopTags = [];
    const headBottomTags = [];
    this.options.forEach((p) => {
      const tag = {
        tagName: p.tagName,
        voidTag: p.voidTag || false,
        attributes: p.attributes,
        innerHTML: p.innerHTML,
      };
      switch (p.position) {
        case 'bodyTop':
          bodyTopTags.push(tag);
          break;
        case 'bodyBottom':
          bodyBottomTags.push(tag);
          break;
        case 'headTop':
          headTopTags.push(tag);
          break;
        case 'headBottom':
          headBottomTags.push(tag);
      }
    });

    data.headTags = [...headTopTags, ...data.headTags, ...headBottomTags];
    data.bodyTags = [...bodyTopTags, ...data.bodyTags, ...bodyBottomTags];

    return data;
  }
}

module.exports = HtmlWebpackInlinePlugin;

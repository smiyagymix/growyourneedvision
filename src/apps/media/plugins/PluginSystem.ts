export interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    enabled: boolean;
    hooks: PluginHookRegistry;
}

export type PluginHook =
    | 'beforeRender'
    | 'afterRender'
    | 'beforeExport'
    | 'afterExport'
    | 'onSceneChange'
    | 'onTemplateLoad';

export type PluginHookCallback = (context: Record<string, unknown>) => void | Promise<void>;

export interface PluginHookRegistry {
    [key: string]: PluginHookCallback[];
}

export class PluginSystem {
    private plugins: Map<string, Plugin> = new Map();
    private globalHooks: Map<PluginHook, PluginHookCallback[]> = new Map();

    register(plugin: Omit<Plugin, 'id' | 'enabled'>): Plugin {
        const registeredPlugin: Plugin = {
            ...plugin,
            id: `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            enabled: true,
        };

        this.plugins.set(registeredPlugin.id, registeredPlugin);
        this.registerHooks(registeredPlugin);

        return registeredPlugin;
    }

    private registerHooks(plugin: Plugin): void {
        Object.entries(plugin.hooks).forEach(([hookName, callbacks]) => {
            const hook = hookName as PluginHook;
            const existing = this.globalHooks.get(hook) || [];
            this.globalHooks.set(hook, [...existing, ...callbacks]);
        });
    }

    unregister(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return false;

        this.unregisterHooks(plugin);
        return this.plugins.delete(pluginId);
    }

    private unregisterHooks(plugin: Plugin): void {
        Object.entries(plugin.hooks).forEach(([hookName, callbacks]) => {
            const hook = hookName as PluginHook;
            const existing = this.globalHooks.get(hook) || [];
            this.globalHooks.set(
                hook,
                existing.filter(cb => !callbacks.includes(cb))
            );
        });
    }

    async executeHook(hook: PluginHook, context: Record<string, unknown>): Promise<void> {
        const callbacks = this.globalHooks.get(hook) || [];

        for (const callback of callbacks) {
            try {
                await callback(context);
            } catch (error) {
                console.error(`Plugin hook "${hook}" failed:`, error);
            }
        }
    }

    enable(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return false;

        plugin.enabled = true;
        this.registerHooks(plugin);
        return true;
    }

    disable(pluginId: string): boolean {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return false;

        plugin.enabled = false;
        this.unregisterHooks(plugin);
        return true;
    }

    getPlugin(pluginId: string): Plugin | null {
        return this.plugins.get(pluginId) || null;
    }

    getAllPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    getEnabledPlugins(): Plugin[] {
        return this.getAllPlugins().filter(p => p.enabled);
    }
}

export const pluginSystem = new PluginSystem();

/**
 * Port: IPlugin
 *
 * Defines the contract for external adapters to integrate with the FOA Core.
 * Following Hexagonal Architecture, the Core interacts with this interface.
 */
export interface IPlugin {
  /**
   * Unique name of the plugin (e.g., 'db', 'cache', 'email')
   * This key will be used to inject the plugin into the FluxContext.
   */
  name: string;

  /**
   * Lifecycle method called when the FluxServer starts.
   * Use this to establish connections.
   * @param config Configuration object specific to this plugin
   */
  setup(config: any): Promise<void>;

  /**
   * Lifecycle method called when the FluxServer stops.
   * Use this to close connections gracefully.
   */
  teardown(): Promise<void>;

  /**
   * Returns the client/instance that should be exposed to the Actions.
   */
  getClient(): any;
}


declare interface FunctionMetadata {
  /**
   * The minimum number of arguments which must be passed to the
   * function. If called with fewer than this number of arguments,
   * the wrapper will raise an exception.
   */
  minArgs: number;

  /**
   * The maximum number of arguments which may be passed to the
   * function. If called with more than this number of arguments,
   * the wrapper will raise an exception.
   */
  maxArgs: number;

  /**
   * If the function doesn't take a callback parameter in some browsers
   * and throws an error when a callback is passed.
   */
  fallbackToNoCallback?: boolean;

  /**
   * Set when `fallbackToNoCallback` is set and this browser doesn't
   * support callbacks for this function.
   */
  noCallback?: boolean;

  /**
   * If the function callback takes only one parameter in some browsers.
   */
  singleCallbackArg?: boolean;
}

declare interface NamespaceMetadata extends Record<string, NamespaceMetadata | FunctionMetadata> {
}

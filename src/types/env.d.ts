/**
 * The one global this package reads. Declared rather than pulled in from
 * @types/node, because this is browser code and it should not be able to reach
 * for `fs` by accident.
 */
declare const process: {
  env: {
    NODE_ENV?: 'development' | 'production' | 'test' | (string & {});
    [name: string]: string | undefined;
  };
};

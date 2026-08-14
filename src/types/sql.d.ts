/** Drizzle's Expo migrator imports generated .sql files via babel-plugin-inline-import. */
declare module '*.sql' {
  const content: string;
  export default content;
}

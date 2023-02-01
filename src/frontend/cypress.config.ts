import { defineConfig } from 'cypress'

export default defineConfig({
  
  e2e: {
    baseUrl: null,
    supportFile: false
  },
  
  
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: '**/*.cy.ts'
  }
  
})
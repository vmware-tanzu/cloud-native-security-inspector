import {environment} from 'src/environments/environment'
// describe('Image Scanner Test', () => {
//   beforeEach(() => {
//     cy.intercept('GET', environment.api.goharbor + '/assessmentreports', { fixture: 'tags.json' })
//     cy.intercept('GET', environment.api.goharbor + '/assessmentreports?limit=10&continue=', { fixture: 'tags.json' })
//     cy.intercept('GET', '/proxy/api/v1/namespaces', { fixture: 'namespace.json' })
//     cy.intercept('GET', '/proxy/apis/apiregistration.k8s.io/v1/apiservices', { fixture: 'apiservices.json' })
//     cy.intercept('GET', '/proxy/api/v1/nodes', { fixture: 'nodes.json' })
//     // cy.visit('https://angular.realworld.io/')
//   })


//   it('Visits the initial project page', () => {
//     cy.visit('/')
//     cy.contains('app is running!')
//   })

// })

describe('Setting Test', () => {
  beforeEach(() => {
    Cypress.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.intercept('GET', environment.api.goharbor + '/assessmentreports', { fixture: 'tags.json' })
    cy.intercept('GET', environment.api.goharbor + '/assessmentreports?limit=10&continue=', { fixture: 'tags.json' })
    cy.intercept('GET', '/proxy/api/v1/namespaces', { fixture: 'namespace.json' })
    cy.intercept('GET', '/proxy/apis/apiregistration.k8s.io/v1/apiservices', { fixture: 'apiservices.json' })
    cy.intercept('GET', '/proxy/api/v1/nodes', { fixture: 'nodes.json' })
    cy.intercept('GET', '/proxy/api/v1/namespaces/default/secrets', { fixture: 'secrets.json' })
    cy.intercept('GET', '/proxy/apis/goharbor.goharbor.io/v1alpha1/settings', { fixture: 'settings.json' })
    cy.intercept('POST', environment.api.k8s + '/namespaces/default/secrets', {
      statusCode: 201,
      body: {
        msg: 'created sussessful!',
      },
    })
    cy.visit('http://127.0.0.1:4004/setting')

    // cy.visit('https://angular.realworld.io/')
  })


  it('open secret modal', () => {
    // cy.contains('Secret-team')
    // create secret
    cy.get('[data-cy=submit]').click()
    cy.get('[data-cy=secret_name]').type('Harbor-test', {force: true})
    cy.get('[data-cy=accessKey]').type('admin', {force: true})
    cy.get('[data-cy=accessSecret]').type('Harbor12345', {force: true})
    cy.get('[data-cy=createSecret]').click()
    // create setting
    cy.get('[data-cy=cut_setting]').click()
    
  })

  it('setting', () => {
    cy.wait(1000)
    // create setting
    cy.get('[data-cy=cut_setting]').click()
    cy.visit('http://127.0.0.1:4004/modify-setting/create')
  })


})


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
    cy.intercept('GET', '/status', {
      statusCode: 200,
      body: {
        msg: 'sussessful!',
      },
    })
    cy.intercept('GET', environment.api.goharbor + '/assessmentreports?limit=10&continue=', { fixture: 'tags.json' })
    cy.intercept('GET', environment.api.k8sPost + '/namespace', { fixture: 'namespace.json' })
    cy.intercept('GET', environment.api.k8sPost + '/apiservice', { fixture: 'apiservices.json' })
    cy.intercept('GET', environment.api.k8sPost + '/node', { fixture: 'nodes.json' })
    cy.intercept('GET', environment.api.k8sPost + '/secret?namespace=default', { fixture: 'secrets.json' })
    cy.intercept('GET', environment.api.k8sPost  + '/harbor', { fixture: 'settings.json' })
    cy.intercept('POST', environment.api.k8sPost  + '/harbor', {
      statusCode: 201,
      body: {
        msg: 'created sussessful!',
      },
    })

    cy.intercept('POST', environment.api.k8sPost+ '/secret?namespace=default' , {
      statusCode: 201,
      body: {
        msg: 'created sussessful!',
      },
    })
    cy.visit('http://127.0.0.1:4004/setting/secret')
    // cy.visit('https://angular.realworld.io/')
  })


  it('open secret modal', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    // cy.contains('Secret-team123')
    // create secret
    cy.get('[data-cy=submit]').click()
    cy.get('[data-cy=secret_name]').type('Harbor-test', {force: true})
    cy.get('[data-cy=accessKey]').type('admin', {force: true})
    cy.get('[data-cy=accessSecret]').type('Harbor12345', {force: true})
    cy.get('[data-cy=createSecret]').click()
  })

  it('setting', () => {
    cy.visit('http://127.0.0.1:4004/data-source/harbor')
    Cypress.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.wait(1000)
    // create setting
    cy.get('[data-cy=cut_setting]').click()
    cy.visit('http://127.0.0.1:4004/modify-data-source/create')
  })


  it('setting create', () => {
    cy.visit('http://127.0.0.1:4004/modify-data-source/create')
    Cypress.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.get('[data-cy=first_next]').click()
    cy.get('[data-cy=second_next]').click()
    cy.get('[data-cy=address]').type('https://api.int.app-catalog.vmware.com/catalog-governor/v1/products', {force: true})
    cy.get('[data-cy=secret]').select('harbor')
    cy.get('[data-cy=third_next]').click()
    cy.get('[data-cy=submit_setting]').click()

  })


})


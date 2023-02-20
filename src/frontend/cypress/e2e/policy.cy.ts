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
    cy.intercept('GET', environment.api.goharbor + '/inspectionpolicies', { fixture: 'policy.json' })
    cy.intercept('GET', '/proxy/apis/goharbor.goharbor.io/v1alpha1/settings', { fixture: 'settings.json' })
    cy.intercept('POST', environment.api.goharbor + '/inspectionpolicies', {
      statusCode: 201,
      body: {
        msg: 'created sussessful!',
      },
    })
    cy.visit('http://127.0.0.1:4004/policy')

    // cy.visit('https://angular.realworld.io/')
  })


  it('new policy', () => {
    // cy.contains('Secret-team')
    // create policy
    cy.intercept('GET', environment.api.goharbor + '/inspectionpolicies', { fixture: 'policy-list.json' })
    cy.visit('http://127.0.0.1:4004/modify-policy/create')
    // cy.get('[data-cy=new_policy]').click()
    cy.get('[data-cy=name]').type('policy-test', {force: true})
    cy.get('[data-cy=namespace]').type('cronjobs', {force: true})
    cy.get('[data-cy=imagePullPolicy]').select('Always')
    cy.get('[data-cy=settingsName]').select('sample-setting')


    cy.get('[data-cy=next-one]').click()
    cy.get('[data-cy=policySettingAddItem]').click()  
    
    cy.get('[data-cy=key]').type('default', {force: true})
    cy.get('[data-cy=value]').type('true', {force: true})

    cy.get('[data-cy=next-two]').click()

    // create policy
    cy.get('[data-cy=created]').click()
    
  })

  // it('setting', () => {
  //   // cy.wait(1000)
  //   // // create setting
  //   // cy.get('[data-cy=cut_setting]').click()
  //   // cy.visit('http://localhost:4004/modify-setting/create')
  // })


})


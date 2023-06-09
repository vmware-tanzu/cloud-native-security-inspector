import { Injectable } from '@angular/core';
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RouteStrategyService implements RouteReuseStrategy {

  public static handlers: { [key: string]: DetachedRouteHandle } = {};
  public storeFlag = false;
  public static deleteRouteSnapshot(path: string): void {
    const name = path.replace(/\//g, '_');    
    if (RouteStrategyService.handlers[name]) {
      delete RouteStrategyService.handlers[name];
    }
  }
  /**
   * Determine whether the current route needs to be cached
   * When this method returns false, the route changes and other methods will be called
   * @param {ActivatedRouteSnapshot} future
   * @param {ActivatedRouteSnapshot} curr
   * @returns {boolean}
   * @memberof CacheRouteReuseStrategy
   */
  public shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    console.log(future.routeConfig, curr.routeConfig);
    if (future.routeConfig?.path === 'trivy' && curr.routeConfig?.path === 'report') {
      this.storeFlag = true
    } else {
      this.storeFlag = false
    }

    return future.routeConfig === curr.routeConfig
      && JSON.stringify(future.params) === JSON.stringify(curr.params);
  }
  /**
   * This method will be called when leaving the current route
   * If it returns true the store method will be called
   * @param {ActivatedRouteSnapshot} route
   * @returns {boolean}
   * @memberof CacheRouteReuseStrategy
   */
  public shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return this.storeFlag
  }
  /**
   * write route to cache
   * How to cache RouteHandle in detail here
   * Provides the route and RouteHandle we left
   * @param {ActivatedRouteSnapshot} route
   * @param {DetachedRouteHandle} detachedTree
   * @memberof CacheRouteReuseStrategy
   */
  public store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {
    RouteStrategyService.handlers[this.getPath(route)] = detachedTree;
  }
  /**
   * The route is navigated If this method returns true the retrieve method is triggered
   * If false the component will be recreated
   * @param {ActivatedRouteSnapshot} route
   * @returns {boolean}
   * @memberof CacheRouteReuseStrategy
   */
  public shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!RouteStrategyService.handlers[this.getPath(route)];
  }
  /**
   * Read cached route from cache
   * Provide the parameters of the current route (the route just opened), and return a cached RouteHandle
   * You can use this method to manually get any cached RouteHandle
   * @param {ActivatedRouteSnapshot} route
   * @returns {(DetachedRouteHandle | null)}
   * @memberof CacheRouteReuseStrategy
   */
  public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return RouteStrategyService.handlers[this.getPath(route)] || null;
  }
  private getPath(route: any): string {
    console.log('dadw', route['_routerState'].url);
    
    const path = route['_routerState'].url.replace(/\//g, '_');
    return path;
  }
}
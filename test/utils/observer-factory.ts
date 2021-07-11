/* eslint-disable import/prefer-default-export */
import { expect } from 'chai';
import { v4 as uuidv4 } from 'uuid';

import { DataLayerObserver, DataLayerConfig } from '../../src/observer';
import MonitorFactory from '../../src/monitor-factory';
import { MockAppender } from '../mocks/appender';
import { LogLevel } from '../../src/utils/logger';

/**
 * The ObserverFactory manages the creation and lifecycle of DataLayerObservers to
 * reduce cross-test side effects. Isolation is necessary because data is handled
 * asynchronously, which can result in race conditions if shared resources
 * are used.
 */
export class ObserverFactory {
  static instance: ObserverFactory;

  appenders: { [key: string]: MockAppender } = {};

  destinations: { [key: string]: any[] } = {};

  observers: { [key: string]: DataLayerObserver } = {};

  /**
   * Creates a DataLayerObserver.
   * @param config that defines the DataLayerConfig
   * @param expectHandlers when true checks there is a handler for each rule
   */
  create(config: DataLayerConfig, expectHandlers = true): string {
    const uuid = uuidv4();

    // if no appender is specified, create one
    if (!config.appender) {
      this.appenders[uuid] = new MockAppender();
      config.appender = this.appenders[uuid]; // eslint-disable-line no-param-reassign
    }

    // if a rule does not specify a destination, create one
    config.rules.forEach((rule) => {
      // special case, pass the empty string to allow auto-creation
      if (rule.destination === '') {
        this.destinations[uuid] = [];
        // eslint-disable-next-line no-param-reassign
        rule.destination = (...data: any[]) => {
          this.destinations[uuid].push(data);
        };
      }
    });

    const observer = new DataLayerObserver({
      logLevel: LogLevel.ERROR,
      ...config,
    });
    expect(observer).to.not.be.undefined;
    expect(observer).to.not.be.null;

    if (expectHandlers) {
      // We can end up with multiple rules for a single array target
      expect(observer.handlers.length >= config.rules.length);
    }

    this.observers[uuid] = observer;

    return uuid;
  }

  /**
   * Cleans up an observer by removing its EventListener from the window and removing
   * auto-created appender and destination.
   * @param id DataLayerObserver ID generated from `create`
   */
  cleanup(id: string) {
    const observer = this.getObserver(id);
    observer.handlers.forEach((handler) => {
      MonitorFactory.getInstance().remove(handler.target.path, true);
      handler.stop();
    });

    delete this.appenders[id];
    delete this.destinations[id];
    delete this.observers[id];
  }

  /**
   * Returns an auto-created appender for a given observer.
   * @param id DataLayerObserver ID generated from `create`
   */
  getAppender(id: string) {
    const appender = this.appenders[id];
    expect(appender, 'Appender was not created by ExpectObserver').to.not.be.undefined;
    return appender;
  }

  /**
   * Returns an auto-created destination queue for a given observer.
   * @param id DataLayerObserver ID generated from `create`
   */
  getDestination(id: string) {
    const queue = this.destinations[id];
    expect(queue, 'Destination queue was not created by ExpectObserver').to.not.be.undefined;
    return queue;
  }

  static getInstance(): ObserverFactory {
    if (!ObserverFactory.instance) {
      ObserverFactory.instance = new ObserverFactory();
    }

    return ObserverFactory.instance;
  }

  getObserver(id: string): DataLayerObserver {
    const observer = this.observers[id];
    expect(observer).to.not.be.undefined;
    expect(observer).to.not.be.null;
    return observer;
  }
}

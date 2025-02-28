import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { IClientOptions, MqttClient } from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: MqttClient;
  private topicHandlers: Map<string, ((message: string) => void)[]> = new Map();

  constructor() {
    const options: IClientOptions = {
      clientId: `mqtt_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    this.client = mqtt.connect(process.env.MQTT_URI || 'mqtt://localhost:1883', options);
  }

  async onModuleInit() {
    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      
      // Resubscribe to topics if we were disconnected
      this.topicHandlers.forEach((_, topic) => {
        this.client.subscribe(topic);
      });
    });

    this.client.on('message', (topic, payload) => {
      const message = payload.toString();
      const handlers = this.topicHandlers.get(topic);
      
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT Client Error', error);
    });
  }

  async onModuleDestroy() {
    return new Promise<void>((resolve) => {
      this.client.end(false, () => {
        console.log('Disconnected from MQTT broker');
        resolve();
      });
    });
  }

  getClient(): MqttClient {
    return this.client;
  }

  publish(topic: string, message: string | object): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      
      this.client.publish(topic, payload, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  subscribe(topic: string, handler: (message: string) => void): void {
    this.client.subscribe(topic, (error) => {
      if (error) {
        console.error(`Failed to subscribe to topic ${topic}`, error);
        return;
      }
      
      console.log(`Subscribed to topic: ${topic}`);
      
      if (!this.topicHandlers.has(topic)) {
        this.topicHandlers.set(topic, []);
      }
      
      this.topicHandlers.get(topic).push(handler);
    });
  }

  unsubscribe(topic: string, handler?: (message: string) => void): void {
    if (!handler) {
      // Unsubscribe from the topic entirely
      this.client.unsubscribe(topic);
      this.topicHandlers.delete(topic);
      return;
    }
    
    // Remove a specific handler
    const handlers = this.topicHandlers.get(topic);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      
      // If no more handlers, unsubscribe from the topic
      if (handlers.length === 0) {
        this.client.unsubscribe(topic);
        this.topicHandlers.delete(topic);
      }
    }
  }
}
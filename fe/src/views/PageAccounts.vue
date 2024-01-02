<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Accounts</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Accounts</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-card :key="account.id" v-for="account in accounts">
        <ion-card-header>
          <ion-card-title>{{ account.username }}</ion-card-title>
          <ion-card-subtitle>Points: {{ account.point }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <p>
            Last login: {{ account.lastLogin }}
          </p>
          <p>
            Last update cookies: {{ account.lastCookiesUpdate }}
          </p>
        </ion-card-content>

        <ion-button fill="clear" @click="updateCookies(account.username)">
          Update Cookies
        </ion-button>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { env } from '@/utils/env'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonCardHeader,
  IonCardContent,
  IonButton
} from '@ionic/vue';
import { onMounted, ref } from 'vue'

type Account = {
  id: string,
  username: string,
  point?: number
  lastCookiesUpdate?: string,
  lastLogin?: string
}

const accounts = ref<Account[]>([])

const updateAccounts = async () => {
  const response = await fetch(`${env.apiUrl}/accounts`)
  const data = await response.json()
  accounts.value = data
}

// TODO: implement loading
const updateCookies = async (username: string) => {
  await fetch(`${env.apiUrl}/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username })
  })
  await updateAccounts()
}

onMounted(() => {
  updateAccounts()
})
</script>

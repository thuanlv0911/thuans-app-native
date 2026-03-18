import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/Header'

export default function Home() {
  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <Header title='Nodaco' showMenu showCart showLogo />
      <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false}>

      </ScrollView>

    </SafeAreaView>
  )
}
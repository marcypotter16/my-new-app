import HeaderToggleButton from '@/components/HeaderToggleButton';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SearchScreen() {
    return (
        <View style={styles.container}>
            <HeaderToggleButton />
            <Text style={styles.title}>Search Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

<template>
	<button @click="login">Login</button>
</template>

<script>
export default {
    methods: {
        login() {
            this.$auth.loginWith('discord', { params: { response_type: 'token' } })
              .then(() => this.$toast.success('Logged In!'))
        },
    }
}
</script>


<template>
	<div class="addwrapper">

		<h3 @click="showHideForm" style="cursor: pointer;">
			<i v-if="showForm" class="fas fa-minus-circle"></i>
			<i v-else class="fas fa-plus-circle"></i>
			Ajouter un livre
		</h3>

		<form v-if="showForm" v-on:submit.prevent="addBookAndReview" method="post" enctype="multipart/form-data">

			<label for="couverture">Couverture</label>
			<input type="file" name="couverture" id="couv" ref="couv" @change="handleCouv" /><br>

			<label for="title">Titre</label>
			<input name="title" v-model="newTitle" style="width: 400px;"><br>

			<label for="auteurs">Auteurs</label>
			<input name="auteurs" v-model="newAuthors" style="width: 400px;"><br>

			<label for="year">Année de parution</label>
			<input name="year" v-model="newYear"><br>

			<label for="tags">Tags</label>
			<multiselect v-model="tags" :options="options"
				:multiple="true"
				:close-on-select="false"
				:clear-on-select="false"
				:taggable="true"
				:tag-placeholder="'Ajouter ce nouveau tag'"
				:placeholder="'Choisir un tag'"
				@tag="addTag"></multiselect><br>


			<label for="rating">Note</label>
			<i :class="rating > 0 ? 'fas fa-star' : 'far fa-star'" @click="rating = 1"></i>
			<i :class="rating > 1 ? 'fas fa-star' : 'far fa-star'" @click="rating = 2"></i>
			<i :class="rating > 2 ? 'fas fa-star' : 'far fa-star'" @click="rating = 3"></i>
			<i :class="rating > 3 ? 'fas fa-star' : 'far fa-star'" @click="rating = 4"></i>
			<i :class="rating > 4 ? 'fas fa-star' : 'far fa-star'" @click="rating = 5"></i>
			<br>

			<div id="newReview" style="margin-left:125px;" v-if="newReview" v-html="$md.render(newReview)"></div>
			<label for="review">Commentaire</label>
			<textarea name="review" style="width: 400px; height: 300px;" v-model="newReview"></textarea><br>
			
			<label></label> <button type="submit">Enregistrer</button>
		</form>

	</div>
</template>


<script>
export default {
	data() {
		return {
			showForm: false,
			newTitle: '',
			newAuthors: '',
			newYear: '',
			tags: [],
			allTags: [],
			rating: 0,
			newReview: '',
			options: ['BD', 'SF', 'Polar'],
			couv: undefined
		}
	},

	methods: {

		showHideForm: function () {this.showForm = ! this.showForm},
		
		addBookAndReview: async function() {
			const bodyFormData = new FormData();
			bodyFormData.append('title',   this.newTitle);
			bodyFormData.append('authors', this.newAuthors);
			bodyFormData.append('year',    this.newYear);
			bodyFormData.append('tags',    this.tags);
			bodyFormData.append('rating',  this.rating);
			bodyFormData.append('review',  this.newReview);
			bodyFormData.append('couv',    this.couv);

			let {data} = await this.$axios.post('/api/book', bodyFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
			// reset book list
			this.$emit('bookadded');
			// -> we need to tell the parents that a book and review have been added
			// this.rows = data.rows;
			// reset form
			this.showForm   = false;
			this.newTitle   = '';
			this.newAuthors = '';
			this.newYear    = '';
			this.rating     = 0;
			this.newReview  = '';
			this.tags = [];
		},

		addTag (newTag) {
			this.options.push(newTag);
			this.tags.push(newTag);
		},

		handleCouv () {
			this.couv = this.$refs.couv.files[0];
		}

	},
}

</script>

<style>

form i.fa-star {
	cursor: pointer;
}

</style>
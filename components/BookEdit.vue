<template>
	<div class="editwrapper">

		<h3 @click="showHideForm" style="cursor: pointer;">
			<i v-if="showForm" class="fas fa-minus-circle"></i>
			<i v-else-if="id" class="fas fa-pen-square"></i>
			<i v-else class="fas fa-plus-circle"></i>
			<span v-if="id">Editer ce livre</span>
			<span v-else>Ajouter un livre</span>
		</h3>

		<form v-if="showForm" v-on:submit.prevent="addBookAndReview" method="post" enctype="multipart/form-data">

			<p v-if="id && ! cover_ext" class="warning">
				<i class="fas fa-exclamation-triangle"></i>
				Il n'y a pas de couverture pour ce livre. Pouvez-vous <a :href="'https://www.qwant.com/?q=' + book.title.split(' ').join('+') + '+' + book.authors.split(' ').join('+') + '+book+cover&t=images'">la chercher</a>, puis l'uploader via ce formulaire ?<br>
				<em>Essayez de ne pas choisir une image trop grosse (supérieure à 500 pixels).</em>
			</p>

			<label for="couverture">Couverture</label>
			<input type="file" name="couverture" id="couv" ref="couv" @change="handleCouv" /><br>

			<label for="title">Titre</label>
			<input name="title" v-model="title" style="width: 400px;"><br>

			<label for="auteurs">Auteurs</label>
			<input name="auteurs" v-model="authors" style="width: 400px;"><br>

			<label for="year">Année de parution</label>
			<input name="year" v-model="year"><br>

			<label for="tags">Tags</label>
			<multiselect v-model="tags" :options="options"
				:multiple="true"
				:close-on-select="false"
				:clear-on-select="false"
				:taggable="true"
				:tag-placeholder="'Ajouter ce nouveau tag'"
				:placeholder="'Choisir un tag'"
				@tag="addTag"></multiselect><br>


			<div v-if="! id">
				<label for="rating">Note</label>
				<i :class="rating > 0 ? 'fas fa-star' : 'far fa-star'" @click="rating = 1"></i>
				<i :class="rating > 1 ? 'fas fa-star' : 'far fa-star'" @click="rating = 2"></i>
				<i :class="rating > 2 ? 'fas fa-star' : 'far fa-star'" @click="rating = 3"></i>
				<i :class="rating > 3 ? 'fas fa-star' : 'far fa-star'" @click="rating = 4"></i>
				<i :class="rating > 4 ? 'fas fa-star' : 'far fa-star'" @click="rating = 5"></i>
				<br>

				<div id="newReview" style="margin-left:125px;" v-if="newReview" v-html="$md.render(newReview)"></div>
				<label for="review">Commentaire</label>
				<textarea name="review" style="width: 400px; height: 300px;" v-model="review"></textarea><br>
			</div>
			
			<label></label> <button type="submit">Enregistrer</button>
		</form>

	</div>
</template>


<script>
export default {

	props: ['book'],

	data() {
		if (this.book) {
			return {
				id       : this.book.id,
				showForm : false,
				title    : this.book.title,
				authors  : this.book.authors,
				year     : this.book.year,
				tags     : this.book.tags,
				options  : ['BD', 'SF', 'Polar'],
				rating   : 0,
				review   : '',
				couv     : null,
				cover_ext : this.book.cover_ext,
			}
		}

		return {
			id: undefined,
			showForm: false,
			title: '',
			authors: '',
			year: '',
			tags: [],
			options: ['BD', 'SF', 'Polar'],
			rating: 0,
			review: '',
			couv: undefined,
			cover_ext: '',
		}
	},

	methods: {

		showHideForm: function () {this.showForm = ! this.showForm},
		
		addBookAndReview: async function() {
			const bodyFormData = new FormData();
			bodyFormData.append('title',   this.title);
			bodyFormData.append('authors', this.authors);
			bodyFormData.append('year',    this.year);
			bodyFormData.append('tags',    this.tags);
			bodyFormData.append('couv',    this.couv);
			if (this.id) {
				bodyFormData.append('id',     this.id);
			} else {
				bodyFormData.append('rating', this.rating);
				bodyFormData.append('review', this.review);
			}

			let {data} = await this.$axios.post('/api/book', bodyFormData, { headers: { 'Content-Type': 'multipart/form-data' } });

			// we say the book was added / changed
			this.$emit('bookadded');

			if (! this.id) {
				// reset form
				this.title    = '';
				this.authors  = '';
				this.year     = '';
				this.rating   = 0;
				this.review   = '';
				this.tags     = [];
			}
			this.showForm = false;
		},

		addTag (newTag) {
			this.options.push(newTag);
			this.tags.push(newTag);
		},

		handleCouv () {
			this.couv = this.$refs.couv.files[0];
		},

	},
}

</script>

<style>

form i.fa-star {
	cursor: pointer;
}

.warning {
	background: #e2a011;
	margin: 4px;
	padding: 8px;
}

</style>
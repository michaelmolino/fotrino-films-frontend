<template>
  <span>
    <div v-if="profile">
      <div class="q-pa-md text-h6 text-center" style="max-width: 720px">
        Dashboard
      </div>
      <div class="q-pa-md text-body text-left" style="max-width: 720px;">
        <div id='editor_holder' class="fotrino-bootstrap"></div>
        <q-btn name="save" label="Save Changes" @click="save()" />
      </div>
    </div>
    <div v-else class="q-pa-md text-h6 text-center" style="max-width: 720px">
      Not logged in!
    </div>
  </span>
</template>

<script>
import { useMeta } from 'quasar'
import { setMetaData } from '../../javascript/library.js'

import { JSONEditor } from '@json-editor/json-editor/dist/jsoneditor.js'

export default {
  name: 'Dashboard',
  data () {
    return {
      editor: null
    }
  },
  computed: {
    profile: {
      get () {
        return this.$store.state.account.profile
      }
    },
    collection: {
      get () {
        return this.$store.state.collection.collection
      }
    }
  },
  created: function () {
    // TODO: this should be a new mutation that fetches all collections
    this.$store.cache
      .dispatch(
        'collection/fetchCollection',
        '91406ba9-1a15-4560-af27-1a9787de6f34'
      )
      .then(() => {
        const element = document.getElementById('editor_holder')
        const editor = new JSONEditor(element, {
          startval: this.collection,
          theme: 'bootstrap4',
          iconlib: 'spectre',
          array_controls_top: false,
          disable_edit_json: true,
          remove_button_labels: false,
          disable_properties: true,
          disable_array_reorder: false,
          disable_array_delete_all_rows: true,
          disable_array_delete_last_row: true,
          disable_array_delete: false,
          disable_array_add: false,
          no_additional_properties: true,
          schema: {
            $schema: 'http://json-schema.org/draft-07/schema',
            $id: 'http://example.com/example.json',
            type: 'object',
            // format: 'grid',
            options: {
              collapsed: false
            },
            title: 'Collection',
            headerTemplate: '&nbsp;{{ self.title }}',
            required: [
              'id',
              'uuid',
              'title',
              'coverUrl',
              'movies'
            ],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                readonly: true,
                title: 'Collection ID: ',
                description: 'The unique ID for your collection (used in the URL).'
              },
              uuid: {
                type: 'hidden',
                pattern: '^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$',
                readonly: true,
                title: 'Collection ID: ',
                description: 'The unique ID for your collection (used in the URL).'
              },
              title: {
                type: 'string',
                title: 'Title'
              },
              coverUrl: {
                type: 'string',
                readonly: true,
                format: 'uri',
                title: 'Cover URL: '
              },
              movies: {
                type: 'array',
                headerTemplate: '&nbsp; Movies',
                items: {
                  type: 'object',
                  // format: 'grid',
                  options: {
                    collapsed: true
                  },
                  title: 'Movies',
                  headerTemplate: '&nbsp;{{ self.title }}',
                  required: [
                    'id',
                    'sort',
                    'title',
                    'coverUrl',
                    'mediaType',
                    'chapters'
                  ],
                  properties: {
                    id: {
                      type: 'integer',
                      readonly: true,
                      title: 'Movie ID: '
                    },
                    sort: {
                      type: 'hidden',
                      title: 'Sort Index: '
                    },
                    title: {
                      type: 'string',
                      title: 'Title: '
                    },
                    subTitle: {
                      type: 'string',
                      title: 'Subtitle: '
                    },
                    coverUrl: {
                      type: 'string',
                      readonly: true,
                      format: 'uri',
                      title: 'Cover URL: '
                    },
                    mediaType: {
                      type: 'string',
                      enum: ['movies', 'audio'],
                      readonly: true,
                      title: 'Media Type: '
                    },
                    chapters: {
                      type: 'array',
                      headerTemplate: '&nbsp; Chapters',
                      options: {
                        collapsed: false
                      },
                      items: {
                        type: 'object',
                        // format: 'grid',
                        options: {
                          collapsed: true
                        },
                        title: 'Chapters',
                        headerTemplate: '&nbsp; {{ self.title }}',
                        required: [
                          'id',
                          'sort',
                          'title',
                          'previewUrl',
                          'src',
                          'type',
                          'primary'
                        ],
                        properties: {
                          id: {
                            type: 'integer',
                            readonly: true,
                            title: 'Chapter ID: '
                          },
                          sort: {
                            type: 'hidden',
                            title: 'Sort Index: '
                          },
                          title: {
                            type: 'string',
                            title: 'Title: '
                          },
                          description: {
                            type: 'string',
                            format: 'markdown',
                            title: 'Description: '
                          },
                          previewUrl: {
                            type: 'string',
                            format: 'uri',
                            readonly: true,
                            title: 'Preview URL: '
                          },
                          src: {
                            type: 'string',
                            readonly: true,
                            title: 'Video Source: '
                          },
                          type: {
                            type: 'string',
                            readonly: true,
                            enum: ['application/vnd.apple.mpegurl'],
                            title: 'Type: '
                          },
                          primary: {
                            type: 'boolean',
                            default: false,
                            title: 'Primary: '
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        })
        this.editor = editor
      })
  },
  setup () {
    function save () {
      console.log('Save button pressed')
    }

    const metaData = setMetaData(null, null)
    useMeta(() => {
      return metaData
    })

    return {
      save
    }
  }
}
</script>
<style type="scss">
  @import '../../css/bootstrap.css';
  @import url('https://unpkg.com/spectre.css/dist/spectre-icons.min.css');
  h3 {
    /* margin-bottom: 0px !important; */
    margin-top: 0.5rem;
  }
  .fotrino-bootstrap .card {
    border: 0px !important
  }
  .json-editor-btntype-toggle {
    margin: 0px 10px 0px 0px;
  }
</style>

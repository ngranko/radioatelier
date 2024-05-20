package repository

type Repository[m interface{}] interface {
	Create(model *m) error
	Save(model *m) error
	Delete(model *m) error
}

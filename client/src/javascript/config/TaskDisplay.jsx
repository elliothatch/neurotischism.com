import React from 'react';

export default class TaskDisplay extends React.Component {
	constructor(props) {
		super(props);
		this.state = {selectedTask: null};
		this.handleSelectionChange = this.handleSelectionChange.bind(this);
	}

	handleSelectionChange(data) {
		this.setState({
			selectedTask: data
		});
	}

	render() {
		return <div className="task-display">
			<div className="task-col">
				<Task task={this.props.task} onSelectionChange={this.handleSelectionChange}></Task>
			</div>
			<TaskLogDisplay task={this.state.selectedTask}></TaskLogDisplay>
		</div>;
	}
}


class TaskLogDisplay extends React.Component {
	render() {
		return <div className="log-display">
			{this.props.task && this.props.task.logs &&
			<ul className="logs">
				{this.props.task.logs.map((l,i) => <li key={i}>{l.message}</li>)}
			</ul>}
		</div>;
	}
}

class Task extends React.Component {
	constructor(props) {
		super(props);
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick(e, data) {
		this.props.onSelectionChange(this.props.task);
	}

	render() {
		return <div className="task">
			<div
				className={`card${this.props.task.status === 1 ? ' success' : ''}${this.props.task.status === 2 ? ' warn' : ''}${this.props.task.status === 3 ? ' error' : ''}`}
				onClick={this.handleClick}>
				<span className={`${this.props.task.running ? 'loader' : ''}`}></span>
				<span className="status">{this.props.task.status}</span>
				<span className="name">{this.props.task.name}</span>
			</div>
			{this.props.task.tasks.length > 0 &&
					<ul className="tasks">
						{this.props.task.tasks.map((t,i) => <li key={i}><Task task={t} onSelectionChange={this.props.onSelectionChange} /></li>)}
					</ul>
			}
		</div>;
	}
}

